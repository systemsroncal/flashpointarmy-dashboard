# Graph Report - dashboard  (2026-07-14)

## Corpus Check
- 630 files · ~304,762 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2994 nodes · 9824 edges · 250 communities (166 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `83d22b9a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- eslint-config-next
- Community 209
- @fortawesome/fontawesome-svg-core
- Community 211
- @fortawesome/free-solid-svg-icons
- Community 213
- Community 214
- @fortawesome/react-fontawesome
- Community 216
- google-auth-library
- isomorphic-dompurify
- leaflet
- leaflet.markercluster
- @mui/icons-material
- @mui/material
- @mui/material-nextjs
- next
- next.config.ts
- nodemailer
- plyr
- react
- react-apexcharts
- react-dom
- react-dropzone
- react-leaflet
- react-simple-maps
- stripe
- @supabase/ssr
- @supabase/supabase-js
- tinymce
- @tinymce/tinymce-react
- supabase
- @types/leaflet
- @types/leaflet.markercluster
- @types/node
- @types/nodemailer
- @types/nprogress
- @types/react
- @types/react-dom
- @types/react-simple-maps
- typescript

## God Nodes (most connected - your core abstractions)
1. `createAdminClient()` - 265 edges
2. `requireApiAuth()` - 249 edges
3. `loadUserRoleNames()` - 240 edges
4. `can()` - 194 edges
5. `loadModulePermissions()` - 191 edges
6. `isElevatedRole()` - 122 edges
7. `requireServerUser()` - 113 edges
8. `MODULE_SLUGS` - 108 edges
9. `createClient()` - 105 edges
10. `requireMobilizeRead()` - 100 edges

## Surprising Connections (you probably didn't know these)
- `buildXlsxBuffer()` --references--> `xlsx`  [EXTRACTED]
  src/lib/export/xlsx-buffer.ts → package.json
- `parseUploadFile()` --references--> `xlsx`  [EXTRACTED]
  src/lib/import/parse-upload.ts → package.json
- `middleware()` --calls--> `isMaintenanceExemptPath()`  [EXTRACTED]
  middleware.ts → src/lib/maintenance.ts
- `middleware()` --calls--> `isMaintenanceMode()`  [EXTRACTED]
  middleware.ts → src/lib/maintenance.ts
- `middleware()` --calls--> `getSupabaseSession()`  [EXTRACTED]
  middleware.ts → src/utils/supabase/middleware.ts

## Import Cycles
- None detected.

## Communities (250 total, 84 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (27): Cell, Body, InviteBody, POST(), POST(), ALLOWED_KEYS, PATCH(), ALLOWED (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (21): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (83): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+75 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (17): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (30): GET(), GET(), GET(), GET(), POST(), parseBackHref(), parseTab(), PersonProfilePageContent() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (5): ChaptersPage(), BroadcastHistoryPage(), CommunityPage(), EditCoursePage(), LogsPage()

### Community 6 - "Community 6"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (15): ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), authLabelSx, authTextFieldSx, hasSeenHint(), HIGHLIGHT (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.05
Nodes (74): RFC-5322, GET(), GET(), PATCH(), requireSuperAdmin(), GET(), GET(), DeliverySummary (+66 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (51): DashboardHomeContent(), DashboardHomePage(), hexToRgb(), MissionCardItem(), MISSIONS_WELCOME, phaseHoverShadow(), ChapterInviteShareDialog(), chapterInviteShareText() (+43 more)

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (8): GET(), GET(), Ctx, POST(), attachGroupNames(), fetchMobilizeEventsInRange(), MobilizeCalendarEventRow, MobilizeAuthOk

### Community 13 - "Community 13"
Cohesion: 0.20
Nodes (14): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventPage(), EventCategoryPill(), EventImageCarousel(), shareHref(), SocialShareButtons() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (21): ChapterRow, ChapterSortKey, ChaptersSection(), LeaderOption, StateSearchAutocomplete(), STATUS_LABEL, statusColor(), barColorForPercent() (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (34): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), POST() (+26 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (27): isPdf(), POST(), POST(), POST(), Ctx, POST(), POST(), isPdf() (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.06
Nodes (63): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, MissionRankInfoDialog(), Props, CoachMeetingData, CoachMeetingsAdminClient() (+55 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (12): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (22): GET(), JoinReq, MobilizeNotificationsPage(), MobilizeChapterUpdatesPanel(), Props, EventNotificationCard(), JoinRequestCard(), MobilizeNotificationsClient() (+14 more)

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (12): GET(), GET(), GroupRow, DuRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), MobilizeGroupBrowseExtras (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (20): GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx, DELETE() (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (21): AnnouncementsNavBadge(), DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV, MOBILIZE_DASHBOARD_NAV_ITEM_SX (+13 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (10): CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey(), videoDurationStorageKey() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.08
Nodes (59): PATCH(), POST(), DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET() (+51 more)

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (35): DELETE(), isCommunicationsAdmin(), PATCH(), DELETE(), PATCH(), GET(), isCommunicationsAdmin(), POST() (+27 more)

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (12): createPlyrRoot(), EventVideoPlyrDialog(), EventVideoPlyrDialogInner(), plyrControls, PlyrLike, looksLikeDirectMedia(), pickDailymotionEmbed(), pickVimeoId() (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.10
Nodes (23): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+15 more)

### Community 31 - "Community 31"
Cohesion: 0.26
Nodes (11): DashboardLayout(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsContext, PermissionsProvider(), DashboardUser, loadDashboardUser() (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (17): GET(), Ctx, GET(), primaryRoleLabel(), GET(), POST(), GET(), PUT() (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.37
Nodes (11): GET(), isBucket(), fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket, enumerateBucketLabels(), pad2() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.30
Nodes (10): chunkIds(), NotificationMenu(), NotificationRow, MobilizeNavNotificationsBadge(), EMPTY, notificationKeys(), useMobilizeNotifications(), getNotificationSoundEnabled() (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (21): POST(), POST(), RouteCtx, rowToCampaign(), GET(), POST(), rowToCampaign(), ADMIN_ROLES (+13 more)

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (13): config, middleware(), POST(), clearSessionStartedCookie(), isAppSessionExpired(), readSessionStartedAt(), isMaintenanceExemptPath(), isMaintenanceMode() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (19): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+11 more)

### Community 40 - "Community 40"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 41 - "Community 41"
Cohesion: 0.39
Nodes (7): POST(), POST(), POST(), POST(), assertCommunityMemberEditAccess(), CommunityMemberEditAccess, getApiSessionWithPermissions()

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.27
Nodes (9): ChangePasswordDialog(), HeaderAccountSettingsButton(), CourseGraduateBadge(), formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (10): MobilizeLayout(), MobilizeContentShell(), MobilizeNotificationsSoundWatcher(), MobilizeToastContext, MobilizeToastProvider(), ToastState, canAccessMobilizeModule(), flashpointTheme (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.07
Nodes (53): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+45 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (18): GET(), isIsoDate(), POST(), PostBody, chaptersForStateFilter(), notifyCertificateRequestSubmitted(), CertListStatus, DB_SORTABLE (+10 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (16): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.11
Nodes (21): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+13 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (11): ReportsPresenceDateRangeControls(), Chart, chartOpts, formatDayLabel(), formatTrend(), rangeLabel(), ReportsPresenceSection(), StatCardProps (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.06
Nodes (34): capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow, Membership, MessageRow (+26 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (18): backup_env_files(), ensure_git_safe_directory(), ensure_repo_owned_by_deploy_owner(), free_listen_port(), kill_next_on_port(), kill_pids_on_port(), maybe_sudo(), PORT (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (4): child, { execSync, spawn }, path, port

### Community 58 - "Community 58"
Cohesion: 0.52
Nodes (6): normalizeKeys(), ParsedUpload, parseUploadFile(), pickBestSheetRows(), rowsFromSheet(), stringifyCell()

### Community 59 - "Community 59"
Cohesion: 0.17
Nodes (14): compareRows(), CourseProgressSortKey, CourseProgressUsersTable(), initialsFromLabel(), pctForRow(), progressColor(), AvatarWithGraduateIcon(), BADGE_STYLES (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.10
Nodes (27): MOBILIZE_GROUP_TAB_ICONS, MOBILIZE_GROUP_TAB_NAV_SX, MobilizeGroupSidebarTabs(), NAV_ITEM_TOUCH_SX, Props, ActiveGroupPayload, ChapterTabLinks(), MOBILIZE_DASHBOARD_NAV_ITEM_SX (+19 more)

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (6): formatEventDateTime(), PublicEventsPage(), EventListItem, EventsListClient(), formatEventDateTime(), formatEventLocationLine()

### Community 62 - "Community 62"
Cohesion: 0.57
Nodes (5): canManageEvents(), Ctx, GET(), isApprovedMember(), POST()

### Community 63 - "Community 63"
Cohesion: 0.42
Nodes (6): POST(), POST(), siteUrl(), createRawToken(), hashActionToken(), createAdminClient()

### Community 64 - "Community 64"
Cohesion: 0.27
Nodes (4): DashboardWelcome(), isNationalOverviewHome(), RoleWelcomeVideoPrompt(), useDashboardUser()

### Community 65 - "Community 65"
Cohesion: 0.62
Nodes (6): chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed(), insertCourseCompletedFeed(), insertCourseSessionCompletedFeed(), formatPrivacyName()

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.44
Nodes (6): Body, POST(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity(), loadUserDisplay()

### Community 76 - "Community 76"
Cohesion: 0.42
Nodes (6): CourseSessionPage(), hostAllowsTrainingDebugQuery(), isTrainingDebugActive(), isTrainingDebugActiveClient(), isTrainingDebugParamAllowedHost(), parseTrainingDebugQueryParam()

### Community 82 - "Community 82"
Cohesion: 0.46
Nodes (4): POST(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError()

### Community 84 - "Community 84"
Cohesion: 0.36
Nodes (5): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo

### Community 85 - "Community 85"
Cohesion: 0.46
Nodes (5): EditCoursePageContent(), NewCoursePageContent(), AuthorLabelRow, AuthorOption, labelForAuthor()

### Community 86 - "Community 86"
Cohesion: 0.13
Nodes (22): Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE(), GET(), PATCH() (+14 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (25): baseOpts, Chart, JourneyProgressAdminClient(), JourneyProgressRow, JourneyProgressStats, loadJourneyProgressBundle(), roleLabel(), ADMIN_ROLE_NAMES (+17 more)

### Community 88 - "Community 88"
Cohesion: 0.18
Nodes (17): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), MyGroupsPage(), MobilizeContentPanel(), Props (+9 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.48
Nodes (5): MobilizeChapterFeedBanner(), Props, MobilizeGroupStateInfo, MOBILIZE_CHAPTER_FEED_BANNER_ASPECT, mobilizeChapterBannerHeading()

### Community 94 - "Community 94"
Cohesion: 0.20
Nodes (14): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+6 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.60
Nodes (4): Ctx, GET(), isApprovedMember(), POST()

### Community 97 - "Community 97"
Cohesion: 0.67
Nodes (4): canManageGroupMembers(), Ctx, DELETE(), PATCH()

### Community 98 - "Community 98"
Cohesion: 0.26
Nodes (16): GET(), parseRoleFilter(), GET(), GET(), GET(), CourseProgressExportRoleFilter, buildUserDirectoryExportRows(), chunkArray() (+8 more)

### Community 99 - "Community 99"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 100 - "Community 100"
Cohesion: 0.33
Nodes (5): CourseGridClient(), SESSION_CARD_TOUCH_SX, SessionCard(), SessionCardModel, TRAINING_LESSONS_PANEL_SX

### Community 101 - "Community 101"
Cohesion: 0.09
Nodes (38): POST(), ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, coerceQuizPayload(), CourseQuizFormEditor() (+30 more)

### Community 102 - "Community 102"
Cohesion: 0.17
Nodes (23): Ctx, GET(), normalizeStateCode(), GET(), Ctx, DELETE(), loadMembership(), PATCH() (+15 more)

### Community 103 - "Community 103"
Cohesion: 0.22
Nodes (15): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+7 more)

### Community 106 - "Community 106"
Cohesion: 0.24
Nodes (12): ActivityFeedRow, CommunityInActionFeed(), displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime() (+4 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 111 - "Community 111"
Cohesion: 0.09
Nodes (44): GET(), POST(), GET(), POST(), PATCH(), PatchBody, STATUSES, PATCH() (+36 more)

### Community 112 - "Community 112"
Cohesion: 0.67
Nodes (3): accept, GatheringImageFields(), uploadToGatheringsBucket()

### Community 113 - "Community 113"
Cohesion: 0.36
Nodes (7): isUserCourseComplete(), userCompletedAllSessions(), CertificateRequestStatus, ExternalCertificateCtaState, loadExternalCertificateCtaState(), shouldShowExternalCertificatePrompt(), userHasPendingCertificateRequest()

### Community 114 - "Community 114"
Cohesion: 0.67
Nodes (3): NH, lat, lng

### Community 116 - "Community 116"
Cohesion: 0.20
Nodes (12): ResetPasswordPage(), ChapterOption, RegisterPage(), MaintenancePage(), metadata, ArmyAuthShell(), authFloatingTextFieldSx, AuthFormBrandHeader() (+4 more)

### Community 117 - "Community 117"
Cohesion: 0.29
Nodes (6): assignmentSteps, checklist, IntroVideoAdminProps, Props, TrainingCommandLanding(), TrainingIntroVideoAdmin()

### Community 119 - "Community 119"
Cohesion: 0.28
Nodes (14): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, displayNameFromUser(), listCoachAssigneeOptions(), listCoachAssigneeUserIds() (+6 more)

### Community 120 - "Community 120"
Cohesion: 0.48
Nodes (6): CITY_COORDS, cityLookupKey(), hashString(), jitterAroundCentroid(), resolveCityCoordinates(), STATE_CENTROIDS

### Community 121 - "Community 121"
Cohesion: 0.13
Nodes (18): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+10 more)

### Community 122 - "Community 122"
Cohesion: 0.13
Nodes (15): BrowseMode, GroupRow, MobilizeMapPageContent(), MobilizeMapView, OriginMode, MobilizeMapPage(), MobilizeGroupListedSwitch(), Props (+7 more)

### Community 127 - "Community 127"
Cohesion: 0.20
Nodes (11): arcs, bbox, geometries, type, objects, nation, states, type (+3 more)

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "Community 130"
Cohesion: 0.20
Nodes (11): LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY, ManualLogForm(), AuditRow, formatAuditDetails(), LogSortKey, LogsTable(), writeAuditLog() (+3 more)

### Community 132 - "Community 132"
Cohesion: 0.33
Nodes (10): US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), escapeRegExp(), normalizeUsStateFromText(), parseStateFromUsAddress(), ResolveStateInput, STATES_BY_NAME_LEN, resolveMobilizeGroupStateCode() (+2 more)

### Community 133 - "Community 133"
Cohesion: 0.11
Nodes (22): NewCourseForm(), FirstLoginPasswordGate(), Cat, CatSortKey, EventCategoriesClient(), CatOpt, ChapterOpt, GatheringStatus (+14 more)

### Community 135 - "Community 135"
Cohesion: 0.15
Nodes (24): Body, POST(), GET(), PATCH(), PatchBody, GET(), PATCH(), AdminsPageContent() (+16 more)

### Community 136 - "Community 136"
Cohesion: 0.19
Nodes (15): GET(), buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots() (+7 more)

### Community 139 - "Community 139"
Cohesion: 0.46
Nodes (4): POST(), Home(), getServerAuth(), setSessionStartedCookie()

### Community 140 - "Community 140"
Cohesion: 0.25
Nodes (9): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), AGE_BUCKETS, ageFromDob(), bucketLabel(), loadPeopleOverviewStats() (+1 more)

### Community 143 - "Community 143"
Cohesion: 0.21
Nodes (20): ProgressPageContent(), progressRoleLabel(), listDashboardUsersByIds(), preferNonEmptyAddr(), graduateBadgeRoleFromRoles(), loadCountableCourseSessionIds(), loadCourseSessionIds(), loadTrainingGraduateBadgesForUsers() (+12 more)

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 146 - "Community 146"
Cohesion: 0.24
Nodes (8): GET(), parseFirstMissionStatus(), PatchBody, STATUSES, PatchBody, STATUSES, FirstMissionStepStatus, loadFirstMissionsMap()

### Community 148 - "Community 148"
Cohesion: 0.32
Nodes (7): AK, lat, lng, AR, lat, lng, WY

### Community 149 - "Community 149"
Cohesion: 0.17
Nodes (6): AdminRolesPage(), BroadcastTemplatesPage(), CourseProgressPage(), NewGatheringPage(), LeadersPage(), DataPaneFallback()

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 155 - "Community 155"
Cohesion: 0.67
Nodes (3): AL, lat, lng

### Community 156 - "Community 156"
Cohesion: 0.67
Nodes (3): AZ, lat, lng

### Community 157 - "Community 157"
Cohesion: 0.67
Nodes (3): CA, lat, lng

### Community 158 - "Community 158"
Cohesion: 0.67
Nodes (3): CO, lat, lng

### Community 159 - "Community 159"
Cohesion: 0.67
Nodes (3): CT, lat, lng

### Community 160 - "Community 160"
Cohesion: 0.67
Nodes (3): DE, lat, lng

### Community 161 - "Community 161"
Cohesion: 0.67
Nodes (3): FL, lat, lng

### Community 162 - "Community 162"
Cohesion: 0.67
Nodes (3): GA, lat, lng

### Community 163 - "Community 163"
Cohesion: 0.67
Nodes (3): HI, lat, lng

### Community 164 - "Community 164"
Cohesion: 0.67
Nodes (3): IA, lat, lng

### Community 165 - "Community 165"
Cohesion: 0.67
Nodes (3): ID, lat, lng

### Community 166 - "Community 166"
Cohesion: 0.67
Nodes (3): IL, lat, lng

### Community 167 - "Community 167"
Cohesion: 0.67
Nodes (3): IN, lat, lng

### Community 168 - "Community 168"
Cohesion: 0.67
Nodes (3): KS, lat, lng

### Community 169 - "Community 169"
Cohesion: 0.67
Nodes (3): KY, lat, lng

### Community 170 - "Community 170"
Cohesion: 0.67
Nodes (3): LA, lat, lng

### Community 171 - "Community 171"
Cohesion: 0.67
Nodes (3): MA, lat, lng

### Community 172 - "Community 172"
Cohesion: 0.67
Nodes (3): MD, lat, lng

### Community 173 - "Community 173"
Cohesion: 0.67
Nodes (3): ME, lat, lng

### Community 174 - "Community 174"
Cohesion: 0.67
Nodes (3): MI, lat, lng

### Community 175 - "Community 175"
Cohesion: 0.67
Nodes (3): MN, lat, lng

### Community 176 - "Community 176"
Cohesion: 0.67
Nodes (3): MO, lat, lng

### Community 177 - "Community 177"
Cohesion: 0.67
Nodes (3): MS, lat, lng

### Community 178 - "Community 178"
Cohesion: 0.67
Nodes (3): MT, lat, lng

### Community 179 - "Community 179"
Cohesion: 0.67
Nodes (3): NC, lat, lng

### Community 180 - "Community 180"
Cohesion: 0.67
Nodes (3): ND, lat, lng

### Community 181 - "Community 181"
Cohesion: 0.67
Nodes (3): NE, lat, lng

### Community 182 - "Community 182"
Cohesion: 0.67
Nodes (3): NJ, lat, lng

### Community 183 - "Community 183"
Cohesion: 0.67
Nodes (3): NM, lat, lng

### Community 184 - "Community 184"
Cohesion: 0.67
Nodes (3): NV, lat, lng

### Community 185 - "Community 185"
Cohesion: 0.67
Nodes (3): NY, lat, lng

### Community 186 - "Community 186"
Cohesion: 0.67
Nodes (3): OH, lat, lng

### Community 187 - "Community 187"
Cohesion: 0.67
Nodes (3): OK, lat, lng

### Community 188 - "Community 188"
Cohesion: 0.67
Nodes (3): OR, lat, lng

### Community 189 - "Community 189"
Cohesion: 0.67
Nodes (3): PA, lat, lng

### Community 190 - "Community 190"
Cohesion: 0.67
Nodes (3): RI, lat, lng

### Community 191 - "Community 191"
Cohesion: 0.67
Nodes (3): SC, lat, lng

### Community 192 - "Community 192"
Cohesion: 0.67
Nodes (3): SD, lat, lng

### Community 193 - "Community 193"
Cohesion: 0.67
Nodes (3): TN, lat, lng

### Community 194 - "Community 194"
Cohesion: 0.67
Nodes (3): TX, lat, lng

### Community 195 - "Community 195"
Cohesion: 0.67
Nodes (3): UT, lat, lng

### Community 196 - "Community 196"
Cohesion: 0.67
Nodes (3): VA, lat, lng

### Community 197 - "Community 197"
Cohesion: 0.67
Nodes (3): VT, lat, lng

### Community 198 - "Community 198"
Cohesion: 0.67
Nodes (3): WA, lat, lng

### Community 199 - "Community 199"
Cohesion: 0.67
Nodes (3): WI, lat, lng

### Community 200 - "Community 200"
Cohesion: 0.67
Nodes (3): WV, lat, lng

## Knowledge Gaps
- **655 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+650 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `xlsx` connect `Community 55` to `Community 9`, `Community 98`, `Community 58`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 144`, `Community 147`, `Community 153`, `Community 154`, `Community 40`, `Community 55`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `Community 95`, `@mui/material-nextjs`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `createAdminClient()` connect `Community 63` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 135`, `Community 8`, `Community 136`, `Community 10`, `Community 12`, `Community 13`, `Community 15`, `Community 143`, `Community 17`, `Community 146`, `Community 23`, `Community 27`, `Community 31`, `Community 33`, `Community 36`, `Community 41`, `Community 47`, `Community 61`, `Community 62`, `Community 75`, `Community 85`, `Community 86`, `Community 96`, `Community 98`, `Community 111`, `Community 119`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _655 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10802469135802469 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08928231486769465 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.10975609756097561 - nodes in this community are weakly interconnected._