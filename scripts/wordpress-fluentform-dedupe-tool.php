<?php
/**
 * Plugin Name: FPA Fluent Forms — Duplicates & incomplete entries
 * Description: English UI + REST API to list duplicate emails and incomplete rows (missing valid email or first name; rows with both are omitted), with delete.
 * Version: 1.0.0
 *
 * Install: copy to wp-content/mu-plugins/wordpress-fluentform-dedupe-tool.php (or require_once from functions.php).
 * Auth: WordPress user with manage_options, OR pass ?secret=... matching FPA_FF_DEDUPE_SECRET in wp-config.php (same pattern as other fpa-tools routes).
 *
 * UI: https://yoursite.com/wp-json/fpa-tools/v1/fluentform-dedupe-ui?secret=YOUR_SECRET
 * Data: GET  .../fluentform-dedupe-data?form_id=1&view=duplicates|incomplete&secret=...
 * Delete: POST .../fluentform-dedupe-delete  JSON: {"form_id":1,"ids":[12,34],"secret":"..."}
 */

if (!defined('ABSPATH')) {
    exit;
}

/** Adjust in wp-config.php if your Fluent form IDs differ. */
if (!defined('FPA_FF_DEDUPE_FORM_LEADERS')) {
    define('FPA_FF_DEDUPE_FORM_LEADERS', 4);
}
if (!defined('FPA_FF_DEDUPE_FORM_MEMBERS')) {
    define('FPA_FF_DEDUPE_FORM_MEMBERS', 1);
}

if (!defined('FPA_FF_DEDUPE_SECRET')) {
    // Optional: define in wp-config.php; if unset, only manage_options can access.
    define('FPA_FF_DEDUPE_SECRET', '');
}

// --- JWT / REST: allow these routes without bearer (optional; remove if not needed).
add_filter('rest_authentication_errors', static function ($result) {
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($uri, '/wp-json/fpa-tools/v1/fluentform-dedupe') !== false) {
        return true;
    }
    return $result;
}, 99);

/** Serve HTML UI without JSON-encoding the body. */
add_filter('rest_pre_serve_request', static function ($served, $result, $request, $server) {
    if (strpos((string) $request->get_route(), '/fpa-tools/v1/fluentform-dedupe-ui') === false) {
        return $served;
    }
    if (!$result instanceof WP_REST_Response) {
        return $served;
    }
    $data = $result->get_data();
    if (!is_string($data)) {
        return $served;
    }
    status_header($result->get_status());
    foreach ($result->get_headers() as $name => $values) {
        $name = preg_replace('/\s+/', ' ', $name);
        if (!is_array($values)) {
            $values = [$values];
        }
        foreach ($values as $value) {
            header(sprintf('%s: %s', $name, $value), false);
        }
    }
    if (!headers_sent()) {
        header('Content-Type: text/html; charset=utf-8', true);
    }
    echo $data;
    return true;
}, 10, 4);

/**
 * @return bool
 */
function fpa_ff_dedupe_can_access(WP_REST_Request $req) {
    if (is_user_logged_in() && current_user_can('manage_options')) {
        return true;
    }
    $sec = (string) FPA_FF_DEDUPE_SECRET;
    if ($sec === '') {
        return false;
    }
    $got = (string) $req->get_param('secret');
    if ($got === '' && $req->get_method() === 'POST') {
        $json = $req->get_json_params();
        if (is_array($json) && isset($json['secret'])) {
            $got = (string) $json['secret'];
        }
    }
    return hash_equals($sec, $got);
}

if (!function_exists('fpa_ff_flatten_response')) {
    /**
     * @param mixed $data
     * @return array<string, string>
     */
    function fpa_ff_flatten_response($data, int $depth = 0) {
        $out = [];
        if ($depth > 8 || !is_array($data)) {
            return $out;
        }
        foreach ($data as $k => $v) {
            if (is_string($v) || is_numeric($v) || is_bool($v)) {
                $out[(string) $k] = trim(wp_strip_all_tags((string) $v));
            } elseif (is_array($v)) {
                foreach (fpa_ff_flatten_response($v, $depth + 1) as $k2 => $v2) {
                    $out[$k2] = $v2;
                }
            }
        }
        return $out;
    }
}

/**
 * @param array<string, string> $flat
 * @return array{email: string, first: string, last: string, phone: string}
 */
function fpa_ff_pick_contact_fields(array $flat) {
    $emailKeys = ['email', 'Email', 'user_email', 'e_mail', 'your_email', 'Email address', 'contact_email'];
    $firstKeys = ['First Name', 'first_name', 'First name', 'fname', 'Given name'];
    $lastKeys = ['Last Name', 'last_name', 'Last name', 'lname', 'Surname', 'Family name'];
    $fullKeys = ['name', 'Name', 'Full Name', 'full_name'];
    $phoneKeys = ['phone', 'Phone', 'mobile', 'Mobile', 'tel', 'Telephone', 'cell', 'Cell'];

    $pick = static function (array $f, array $keys) {
        foreach ($keys as $k) {
            if (isset($f[$k]) && $f[$k] !== '') {
                return $f[$k];
            }
        }
        foreach ($f as $k => $v) {
            if ($v === '') {
                continue;
            }
            foreach ($keys as $want) {
                if (strcasecmp((string) $k, $want) === 0) {
                    return $v;
                }
            }
        }
        return '';
    };

    $email = strtolower(trim($pick($flat, $emailKeys)));
    $first = $pick($flat, $firstKeys);
    $last = $pick($flat, $lastKeys);
    $phone = $pick($flat, $phoneKeys);

    if ($first === '' && $last === '') {
        $full = $pick($flat, $fullKeys);
        if ($full !== '') {
            $parts = preg_split('/\s+/', $full, 2);
            $first = $parts[0] ?? '';
            $last = $parts[1] ?? '';
        }
    }

    return [
        'email' => $email,
        'first' => $first,
        'last' => $last,
        'phone' => $phone,
    ];
}

/**
 * @return array{email: string, first: string, last: string, phone: string}
 */
function fpa_ff_parse_submission_row(array $row) {
    $decoded = json_decode((string) ($row['response'] ?? ''), true);
    $flat = fpa_ff_flatten_response(is_array($decoded) ? $decoded : []);
    return fpa_ff_pick_contact_fields($flat);
}

/**
 * “Incomplete” list: show rows that still need a valid email or a first name.
 * Omit when there is a valid email and a non-empty first name (covers email+first and email+first+last).
 *
 * @param array{email: string, first: string, last?: string, phone?: string} $contact
 */
function fpa_ff_is_incomplete_row(array $contact) {
    $email = trim((string) ($contact['email'] ?? ''));
    $emailOk = $email !== '' && is_email($email);
    $firstOk = trim((string) ($contact['first'] ?? '')) !== '';
    if ($emailOk && $firstOk) {
        return false;
    }
    return true;
}

/**
 * @return list<array{id:int,form_id:int,status:string,created_at:string,email:string,first:string,last:string,phone:string,duplicate_group?:string}>
 */
function fpa_ff_load_form_rows(int $form_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'fluentform_submissions';
    $like = $wpdb->esc_like($table);
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $like)) !== $table) {
        return [];
    }
    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT id, form_id, status, created_at, response FROM `{$table}` WHERE form_id = %d ORDER BY id ASC",
            $form_id
        ),
        ARRAY_A
    );
    return is_array($rows) ? $rows : [];
}

add_action('rest_api_init', static function () {
    register_rest_route('fpa-tools/v1', '/fluentform-dedupe-ui', [
        'methods' => 'GET',
        'permission_callback' => 'fpa_ff_dedupe_can_access',
        'callback' => static function (WP_REST_Request $req) {
            $secret = esc_attr((string) $req->get_param('secret'));
            $html = fpa_ff_dedupe_render_html($secret);
            $response = new WP_REST_Response($html, 200);
            $response->header('Content-Type', 'text/html; charset=utf-8');
            return $response;
        },
    ]);

    register_rest_route('fpa-tools/v1', '/fluentform-dedupe-data', [
        'methods' => 'GET',
        'permission_callback' => 'fpa_ff_dedupe_can_access',
        'callback' => static function (WP_REST_Request $req) {
            $form_id = absint($req->get_param('form_id'));
            $view = (string) $req->get_param('view');
            if ($form_id <= 0) {
                return new WP_REST_Response(['ok' => false, 'error' => 'Invalid form_id'], 400);
            }
            if (!in_array($view, ['duplicates', 'incomplete'], true)) {
                return new WP_REST_Response(['ok' => false, 'error' => 'view must be duplicates or incomplete'], 400);
            }

            $raw = fpa_ff_load_form_rows($form_id);
            $parsed = [];
            foreach ($raw as $r) {
                $c = fpa_ff_parse_submission_row($r);
                $parsed[] = [
                    'id' => (int) $r['id'],
                    'form_id' => (int) $r['form_id'],
                    'status' => (string) $r['status'],
                    'created_at' => (string) $r['created_at'],
                    'email' => $c['email'],
                    'first_name' => $c['first'],
                    'last_name' => $c['last'],
                    'phone' => $c['phone'],
                ];
            }

            if ($view === 'incomplete') {
                $out = array_values(array_filter($parsed, static function ($row) {
                    return fpa_ff_is_incomplete_row([
                        'email' => $row['email'],
                        'first' => $row['first_name'],
                        'last' => $row['last_name'],
                        'phone' => $row['phone'],
                    ]);
                }));
                $out = array_map(static function ($row) {
                    unset($row['created_at']);

                    return $row;
                }, $out);

                return new WP_REST_Response(['ok' => true, 'form_id' => $form_id, 'view' => $view, 'rows' => $out], 200);
            }

            // duplicates: same normalized email, non-empty email, count > 1
            $byEmail = [];
            foreach ($parsed as $row) {
                $e = $row['email'];
                if ($e === '' || !is_email($e)) {
                    continue;
                }
                if (!isset($byEmail[$e])) {
                    $byEmail[$e] = [];
                }
                $byEmail[$e][] = $row;
            }
            $dupRows = [];
            $paletteN = 6;
            foreach ($byEmail as $email => $group) {
                if (count($group) < 2) {
                    continue;
                }
                usort($group, static function ($a, $b) {
                    $ca = strtotime((string) ($a['created_at'] ?? '')) ?: 0;
                    $cb = strtotime((string) ($b['created_at'] ?? '')) ?: 0;
                    if ($cb !== $ca) {
                        return $cb <=> $ca;
                    }

                    return (int) $b['id'] <=> (int) $a['id'];
                });
                $pi = abs(crc32($email)) % $paletteN;
                foreach ($group as $idx => $row) {
                    unset($row['created_at']);
                    $row['duplicate_group'] = $email;
                    $row['dup_palette'] = $pi;
                    $row['is_duplicate_keeper'] = ($idx === 0);
                    $dupRows[] = $row;
                }
            }
            usort($dupRows, static function ($a, $b) {
                $cmp = strcmp((string) $a['duplicate_group'], (string) $b['duplicate_group']);
                if ($cmp !== 0) {
                    return $cmp;
                }

                return (int) $b['id'] <=> (int) $a['id'];
            });

            return new WP_REST_Response(['ok' => true, 'form_id' => $form_id, 'view' => $view, 'rows' => $dupRows], 200);
        },
    ]);

    register_rest_route('fpa-tools/v1', '/fluentform-dedupe-delete', [
        'methods' => 'POST',
        'permission_callback' => 'fpa_ff_dedupe_can_access',
        'callback' => static function (WP_REST_Request $req) {
            $body = $req->get_json_params();
            if (!is_array($body)) {
                $body = [];
            }
            $form_id = isset($body['form_id']) ? absint($body['form_id']) : 0;
            $ids = isset($body['ids']) && is_array($body['ids']) ? array_map('absint', $body['ids']) : [];
            $ids = array_values(array_filter($ids, static fn ($n) => $n > 0));
            if ($form_id <= 0 || !$ids) {
                return new WP_REST_Response(['ok' => false, 'error' => 'form_id and non-empty ids[] required'], 400);
            }

            global $wpdb;
            $table = $wpdb->prefix . 'fluentform_submissions';
            $meta = $wpdb->prefix . 'fluentform_submission_meta';

            $deleted = [];
            foreach ($ids as $id) {
                $owner = (int) $wpdb->get_var($wpdb->prepare("SELECT id FROM `{$table}` WHERE id = %d AND form_id = %d", $id, $form_id));
                if (!$owner) {
                    continue;
                }
                $wpdb->delete($meta, ['submission_id' => $id], ['%d']);
                $wpdb->delete($table, ['id' => $id, 'form_id' => $form_id], ['%d', '%d']);
                $deleted[] = $id;
            }

            return new WP_REST_Response(['ok' => true, 'deleted_ids' => $deleted], 200);
        },
    ]);
});

/**
 * @return string HTML document
 */
function fpa_ff_dedupe_render_html(string $secret_q) {
    $base = esc_url_raw(rest_url('fpa-tools/v1/'));
    $leaders = (int) FPA_FF_DEDUPE_FORM_LEADERS;
    $members = (int) FPA_FF_DEDUPE_FORM_MEMBERS;
    $sec = esc_js($secret_q);

    ob_start();
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fluent Forms — Duplicates &amp; incomplete</title>
  <style>
    :root { --bg:#0f1419; --panel:#1a2332; --text:#e7ecf3; --muted:#8b9cb3; --accent:#5b9fd4; --danger:#c94c4c; --line:#2a3a52; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, Segoe UI, Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 1.25rem; line-height: 1.45; }
    h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 1rem; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; border-bottom: 1px solid var(--line); padding-bottom: 0.5rem; }
    .tabs button {
      background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--muted);
      padding: 0.5rem 1rem; border-radius: 8px 8px 0 0; cursor: pointer; font-size: 0.95rem; margin-bottom: -1px;
    }
    .tabs button:hover { color: var(--text); }
    .tabs button[aria-selected="true"] { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
    .tab-panel { display: none; }
    .tab-panel.is-active { display: block; }
    .subgrid { display: grid; gap: 1.5rem; }
    @media (min-width: 960px) { .subgrid { grid-template-columns: 1fr 1fr; } }
    section.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 1rem; }
    section.panel h2 { font-size: 0.95rem; margin: 0 0 0.75rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    table { width: 100%; border-collapse: collapse; font-size: 0.98rem; }
    th, td { text-align: left; padding: 0.5rem 0.4rem; border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-weight: 600; white-space: nowrap; font-size: 0.93rem; }
    tr:hover td { background: rgba(255,255,255,0.03); }
    .mono { font-family: ui-monospace, monospace; font-size: 0.9rem; }
    .dup-pal-0 { border-left: 4px solid #e57373; background: rgba(229,115,115,0.07); }
    .dup-pal-1 { border-left: 4px solid #64b5f6; background: rgba(100,181,246,0.08); }
    .dup-pal-2 { border-left: 4px solid #81c784; background: rgba(129,199,132,0.08); }
    .dup-pal-3 { border-left: 4px solid #ffb74d; background: rgba(255,183,77,0.09); }
    .dup-pal-4 { border-left: 4px solid #ba68c8; background: rgba(186,104,200,0.08); }
    .dup-pal-5 { border-left: 4px solid #4dd0e1; background: rgba(77,208,225,0.08); }
    tr.dup-group-start td { border-top: 2px solid rgba(255,255,255,0.22); }
    tr.dup-row-keeper td { opacity: 0.92; }
    .keeper-tag { font-size: 0.7rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
    .actions { display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center; margin-bottom: 0.5rem; }
    button.sm { font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer; border: 1px solid var(--line); background: #243044; color: var(--text); }
    button.sm.danger { border-color: var(--danger); color: #ffb4b4; }
    button.sm:disabled { opacity: 0.45; cursor: not-allowed; }
    .msg { font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; min-height: 1.2em; }
    .err { color: #ff8a8a; }
    .ok { color: #8dd4a0; }
    .truncate { max-width: 13rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  </style>
</head>
<body>
  <h1>Fluent Forms — Duplicates &amp; incomplete records</h1>
  <p style="color:var(--muted);font-size:0.85rem;margin:0 0 1rem;">Each tab has its own tables (form <?php echo (int) $leaders; ?> Leaders, form <?php echo (int) $members; ?> Members). Switching tabs does not reload data. Use Reload on a section to refresh it. Deletes cannot be undone.</p>
  <div class="tabs" role="tablist" aria-label="Form type">
    <button type="button" role="tab" id="tab-leaders" aria-controls="panel-leaders" aria-selected="true">Leaders</button>
    <button type="button" role="tab" id="tab-members" aria-controls="panel-members" aria-selected="false">Members</button>
  </div>

  <div id="panel-leaders" class="tab-panel is-active" role="tabpanel" aria-labelledby="tab-leaders" data-form-id="<?php echo (int) $leaders; ?>">
    <p class="mono" style="color:var(--muted);font-size:0.8rem;margin:0 0 1rem;">Form ID <?php echo (int) $leaders; ?> · Leaders</p>
    <div class="subgrid">
      <section class="panel">
        <h2>Duplicate email</h2>
        <div class="actions">
          <button type="button" class="sm" id="dupReload_leaders">Reload</button>
          <button type="button" class="sm danger" id="dupDeleteSelected_leaders" disabled>Delete selected</button>
        </div>
        <div class="msg" id="dupMsg_leaders"></div>
        <div style="overflow:auto;max-height:65vh;">
          <table>
            <thead><tr>
              <th><input type="checkbox" id="dupSelectAll_leaders" title="Select all deletable (newest per email is not selected)" /></th>
              <th>ID</th><th>Status</th><th>Email</th><th>First</th><th>Last</th><th>Phone</th><th></th>
            </tr></thead>
            <tbody id="dupBody_leaders"><tr><td colspan="8" style="color:var(--muted)">Loading…</td></tr></tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <h2>Incomplete (missing valid email or first name)</h2>
        <div class="actions">
          <button type="button" class="sm" id="incReload_leaders">Reload</button>
          <button type="button" class="sm danger" id="incDeleteSelected_leaders" disabled>Delete selected</button>
        </div>
        <div class="msg" id="incMsg_leaders"></div>
        <div style="overflow:auto;max-height:65vh;">
          <table>
            <thead><tr>
              <th><input type="checkbox" id="incSelectAll_leaders" title="Select all" /></th>
              <th>ID</th><th>Status</th><th>Email</th><th>First</th><th>Last</th><th>Phone</th><th></th>
            </tr></thead>
            <tbody id="incBody_leaders"><tr><td colspan="8" style="color:var(--muted)">Loading…</td></tr></tbody>
          </table>
        </div>
      </section>
    </div>
  </div>

  <div id="panel-members" class="tab-panel" role="tabpanel" aria-labelledby="tab-members" data-form-id="<?php echo (int) $members; ?>">
    <p class="mono" style="color:var(--muted);font-size:0.8rem;margin:0 0 1rem;">Form ID <?php echo (int) $members; ?> · Members</p>
    <div class="subgrid">
      <section class="panel">
        <h2>Duplicate email</h2>
        <div class="actions">
          <button type="button" class="sm" id="dupReload_members">Reload</button>
          <button type="button" class="sm danger" id="dupDeleteSelected_members" disabled>Delete selected</button>
        </div>
        <div class="msg" id="dupMsg_members"></div>
        <div style="overflow:auto;max-height:65vh;">
          <table>
            <thead><tr>
              <th><input type="checkbox" id="dupSelectAll_members" title="Select all deletable (newest per email is not selected)" /></th>
              <th>ID</th><th>Status</th><th>Email</th><th>First</th><th>Last</th><th>Phone</th><th></th>
            </tr></thead>
            <tbody id="dupBody_members"><tr><td colspan="8" style="color:var(--muted)">Loading…</td></tr></tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <h2>Incomplete (missing valid email or first name)</h2>
        <div class="actions">
          <button type="button" class="sm" id="incReload_members">Reload</button>
          <button type="button" class="sm danger" id="incDeleteSelected_members" disabled>Delete selected</button>
        </div>
        <div class="msg" id="incMsg_members"></div>
        <div style="overflow:auto;max-height:65vh;">
          <table>
            <thead><tr>
              <th><input type="checkbox" id="incSelectAll_members" title="Select all" /></th>
              <th>ID</th><th>Status</th><th>Email</th><th>First</th><th>Last</th><th>Phone</th><th></th>
            </tr></thead>
            <tbody id="incBody_members"><tr><td colspan="8" style="color:var(--muted)">Loading…</td></tr></tbody>
          </table>
        </div>
      </section>
    </div>
  </div>

  <script>
(function () {
  const BASE = <?php echo json_encode($base, JSON_UNESCAPED_SLASHES); ?>;
  const SECRET = <?php echo json_encode($secret_q); ?>;
  const q = (u) => u + (u.indexOf('?') >= 0 ? '&' : '?') + 'secret=' + encodeURIComponent(SECRET);

  function $(id) { return document.getElementById(id); }

  async function fetchJSON(path) {
    const r = await fetch(q(BASE + path), { credentials: 'same-origin' });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch (e) { throw new Error(t.slice(0, 200)); }
    if (!r.ok) throw new Error(j.error || j.message || t.slice(0, 200));
    return j;
  }

  async function postDelete(formId, ids) {
    const r = await fetch(q(BASE + 'fluentform-dedupe-delete'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_id: formId, ids: ids, secret: SECRET }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || 'Delete failed');
    return j.deleted_ids || [];
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  }

  function rowHtmlInc(r, rowClass) {
    const id = r.id;
    return '<tr data-id="'+id+'">' +
      '<td><input type="checkbox" class="'+rowClass+'" value="'+id+'" /></td>' +
      '<td class="mono">'+id+'</td>' +
      '<td>'+esc(r.status)+'</td>' +
      '<td class="truncate" title="'+esc(r.email)+'">'+esc(r.email || '—')+'</td>' +
      '<td class="truncate" title="'+esc(r.first_name)+'">'+esc(r.first_name || '—')+'</td>' +
      '<td class="truncate" title="'+esc(r.last_name)+'">'+esc(r.last_name || '—')+'</td>' +
      '<td class="truncate" title="'+esc(r.phone)+'">'+esc(r.phone || '—')+'</td>' +
      '<td><button type="button" class="sm danger js-row-del" data-id="'+id+'">Delete</button></td>' +
      '</tr>';
  }

  function rowHtmlDup(r, rowClass, groupStart) {
    const id = r.id;
    const keeper = r.is_duplicate_keeper === true;
    let palN = parseInt(r.dup_palette, 10);
    if (isNaN(palN)) palN = 0;
    palN = ((palN % 6) + 6) % 6;
    const trClass = 'dup-pal-' + palN + (groupStart ? ' dup-group-start' : '') + (keeper ? ' dup-row-keeper' : '');
    const dis = keeper ? ' disabled' : '';
    const keeperTag = keeper ? ' <span class="keeper-tag">Keep</span>' : '';
    return '<tr data-id="'+id+'" class="'+trClass+'">' +
      '<td><input type="checkbox" class="'+rowClass+'" value="'+id+'"'+dis+' />'+keeperTag+'</td>' +
      '<td class="mono">'+id+'</td>' +
      '<td>'+esc(r.status)+'</td>' +
      '<td class="truncate" title="'+esc(r.email)+'">'+esc(r.email || '—')+'</td>' +
      '<td class="truncate" title="'+esc(r.first_name)+'">'+esc(r.first_name || '—')+'</td>' +
      '<td class="truncate" title="'+esc(r.last_name)+'">'+esc(r.last_name || '—')+'</td>' +
      '<td class="truncate" title="'+esc(r.phone)+'">'+esc(r.phone || '—')+'</td>' +
      '<td><button type="button" class="sm danger js-row-del" data-id="'+id+'">Delete</button></td>' +
      '</tr>';
  }

  async function loadDup(formId, panel, afterDelete) {
    const msg = $('dupMsg_' + panel);
    const body = $('dupBody_' + panel);
    const cbClass = 'dup-cb-' + panel;
    if (!afterDelete) {
      msg.textContent = 'Loading duplicates…';
      msg.className = 'msg';
    }
    try {
      const j = await fetchJSON('fluentform-dedupe-data?form_id='+formId+'&view=duplicates');
      const rows = j.rows || [];
      body.innerHTML = rows.length
        ? rows.map((r, i) => {
            const prev = i > 0 ? rows[i - 1] : null;
            const groupStart = !prev || String(prev.duplicate_group || '') !== String(r.duplicate_group || '');
            return rowHtmlDup(r, cbClass, groupStart);
          }).join('')
        : '<tr><td colspan="8" style="color:var(--muted)">No duplicates.</td></tr>';
      $('dupSelectAll_' + panel).checked = false;
      $('dupDeleteSelected_' + panel).disabled = true;
      msg.textContent = rows.length + ' row(s).';
      msg.className = 'msg ok';
    } catch (e) {
      msg.textContent = e.message;
      msg.className = 'msg err';
    }
  }

  async function loadInc(formId, panel, afterDelete) {
    const msg = $('incMsg_' + panel);
    const body = $('incBody_' + panel);
    const cbClass = 'inc-cb-' + panel;
    if (!afterDelete) {
      msg.textContent = 'Loading incomplete…';
      msg.className = 'msg';
    }
    try {
      const j = await fetchJSON('fluentform-dedupe-data?form_id='+formId+'&view=incomplete');
      const rows = j.rows || [];
      body.innerHTML = rows.length ? rows.map(r => rowHtmlInc(r, cbClass)).join('') : '<tr><td colspan="8" style="color:var(--muted)">No incomplete rows.</td></tr>';
      $('incSelectAll_' + panel).checked = false;
      $('incDeleteSelected_' + panel).disabled = true;
      msg.textContent = rows.length + ' row(s).';
      msg.className = 'msg ok';
    } catch (e) {
      msg.textContent = e.message;
      msg.className = 'msg err';
    }
  }

  function wireBulk(body, allId, btnId, cbClass, formId, panel) {
    const all = $(allId);
    const btn = $(btnId);
    function selectable() {
      return body.querySelectorAll('input.' + cbClass + ':not(:disabled)');
    }
    function syncBulk() {
      const list = selectable();
      const checked = body.querySelectorAll('input.' + cbClass + ':not(:disabled):checked');
      btn.disabled = checked.length === 0;
      if (list.length && checked.length < list.length) all.checked = false;
      if (list.length && checked.length === list.length) all.checked = true;
    }
    all.onchange = () => {
      selectable().forEach(c => { c.checked = all.checked; });
      syncBulk();
    };
    body.addEventListener('change', e => {
      if (e.target.classList.contains(cbClass)) syncBulk();
    });
    btn.addEventListener('click', async () => {
      const ids = Array.from(body.querySelectorAll('input.' + cbClass + ':not(:disabled):checked')).map(c => parseInt(c.value, 10));
      if (!ids.length) return;
      if (!confirm('Delete ' + ids.length + ' submission(s)?')) return;
      btn.disabled = true;
      try {
        await postDelete(formId, ids);
        await loadDup(formId, panel, true);
        await loadInc(formId, panel, true);
      } catch (err) {
        alert(err.message);
      }
      btn.disabled = true;
    });
    body.addEventListener('click', async e => {
      const b = e.target.closest('.js-row-del');
      if (!b || !body.contains(b)) return;
      const id = parseInt(b.dataset.id, 10);
      if (!confirm('Delete submission #' + id + '?')) return;
      b.disabled = true;
      try {
        await postDelete(formId, [id]);
        await loadDup(formId, panel, true);
        await loadInc(formId, panel, true);
      } catch (err) {
        alert(err.message);
        b.disabled = false;
      }
    });
  }

  function initPanel(formId, panel) {
    const dupBody = $('dupBody_' + panel);
    const incBody = $('incBody_' + panel);
    wireBulk(dupBody, 'dupSelectAll_' + panel, 'dupDeleteSelected_' + panel, 'dup-cb-' + panel, formId, panel);
    wireBulk(incBody, 'incSelectAll_' + panel, 'incDeleteSelected_' + panel, 'inc-cb-' + panel, formId, panel);
    $('dupReload_' + panel).addEventListener('click', () => void loadDup(formId, panel, false));
    $('incReload_' + panel).addEventListener('click', () => void loadInc(formId, panel, false));
  }

  const leadersId = <?php echo (int) $leaders; ?>;
  const membersId = <?php echo (int) $members; ?>;

  document.getElementById('tab-leaders').addEventListener('click', () => {
    document.getElementById('tab-leaders').setAttribute('aria-selected', 'true');
    document.getElementById('tab-members').setAttribute('aria-selected', 'false');
    document.getElementById('panel-leaders').classList.add('is-active');
    document.getElementById('panel-members').classList.remove('is-active');
  });
  document.getElementById('tab-members').addEventListener('click', () => {
    document.getElementById('tab-members').setAttribute('aria-selected', 'true');
    document.getElementById('tab-leaders').setAttribute('aria-selected', 'false');
    document.getElementById('panel-members').classList.add('is-active');
    document.getElementById('panel-leaders').classList.remove('is-active');
  });

  function init() {
    initPanel(leadersId, 'leaders');
    initPanel(membersId, 'members');
    Promise.all([
      loadDup(leadersId, 'leaders', false),
      loadInc(leadersId, 'leaders', false),
      loadDup(membersId, 'members', false),
      loadInc(membersId, 'members', false),
    ]);
  }
  init();
})();
  </script>
</body>
</html>
    <?php
    return (string) ob_get_clean();
}
