# Graph Report - dashboard  (2026-07-22)

## Corpus Check
- 723 files · ~343,200 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3342 nodes · 11054 edges · 220 communities (136 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `304b9592`
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
- UserProfileDrawer.tsx
- Community 101
- Community 102
- Community 103
- Community 104
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- CourseGraduateBadge.tsx
- Community 113
- Community 115
- Community 117
- parse-upload.ts
- EditCoursePageContent.tsx
- Community 121
- page.tsx
- page.tsx
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- page.tsx
- Community 131
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 139
- Community 140
- Community 141
- Community 142
- Community 144
- Community 145
- page.tsx
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
- Community 189
- page.tsx
- ManualLogForm.tsx
- Community 201
- Community 202
- Community 203
- Community 206
- Community 207
- eslint-config-next
- Community 209
- @fortawesome/fontawesome-svg-core
- Community 211
- @fortawesome/free-solid-svg-icons
- @fortawesome/react-fontawesome
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
1. `createAdminClient()` - 267 edges
2. `loadUserRoleNames()` - 250 edges
3. `requireApiAuth()` - 249 edges
4. `can()` - 196 edges
5. `loadModulePermissions()` - 195 edges
6. `requireMobilizeRead()` - 151 edges
7. `isElevatedRole()` - 123 edges
8. `requireServerUser()` - 117 edges
9. `createClient()` - 109 edges
10. `MODULE_SLUGS` - 108 edges

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

## Communities (220 total, 84 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (20): LeadersPageContent(), PeoplePage(), PeoplePageContent(), isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (28): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (81): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+73 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (62): fetchPresenceRowsInRange(), GET(), PresenceRow, ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode() (+54 more)

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (18): GET(), parseRoleFilter(), GET(), GET(), GET(), preferNonEmptyAddr(), CourseProgressExportRoleFilter, assertSuperAdminExportAccess() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (5): ChaptersPage(), BroadcastHistoryPage(), CommunityPage(), EditCoursePage(), LogsPage()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (13): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, displayNameFromUser(), listCoachAssigneeOptions(), listCoachAssigneeUserIds() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (22): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), ChapterOption, RegisterPage(), MaintenancePage() (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.57
Nodes (5): canManageEvents(), Ctx, GET(), isApprovedMember(), POST()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (12): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (27): DeliverySummary, EmailDeliverySettingsPanel(), Branding, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex(), PREVIEW_SHORTCODES (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (17): Ctx, GET(), primaryRoleLabel(), GET(), GET(), dashboardRowFromAuthUser(), DashboardUserListRow, listAdminDashboardUserIds() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (57): DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET(), GET(), AdminRolesPageContent() (+49 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (26): buildCommentTree(), CommentNode, CommentRow, Ctx, GET(), loadMembership(), POST(), GET() (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (29): isPdf(), POST(), POST(), POST(), POST(), Ctx, POST(), POST() (+21 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.36
Nodes (10): DELETE(), isCommunicationsAdmin(), PATCH(), DELETE(), PATCH(), GET(), isCommunicationsAdmin(), POST() (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (41): GET(), ActivityFeedRow, CommunityInActionFeed(), displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate() (+33 more)

### Community 22 - "Community 22"
Cohesion: 0.09
Nodes (37): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), Cell (+29 more)

### Community 23 - "Community 23"
Cohesion: 0.12
Nodes (25): GET(), PUT(), AdBlockThumbnail(), blockLabel(), blockPreviewImageUrl(), MobilizeFeedAdsSettingsForm(), MobilizePolicySettingsForm(), MobilizeSettingsClient() (+17 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (22): AnnouncementsNavBadge(), DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV, MOBILIZE_DASHBOARD_NAV_ITEM_SX (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (13): CourseSessionPage(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey(), videoDurationStorageKey() (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (36): formatEventDateTime(), PublicEventsPage(), Props, PublicMobilizeGroupPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX, SessionCard(), SessionCardModel (+28 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.06
Nodes (59): Ctx, isApprovedMember(), POST(), Ctx, loadMembership(), POST(), DELETE(), GET() (+51 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (21): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+13 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.11
Nodes (28): GET(), Ctx, POST(), GET(), POST(), GET(), GET(), GroupRow (+20 more)

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (13): GET(), isBucket(), CourseQuizResultRow, CourseSessionProgressRow, fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (40): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+32 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (15): GET(), POST(), GET(), POST(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic(), isMemberOnboardingAudience() (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (16): config, middleware(), POST(), POST(), clearSessionStartedCookie(), isAppSessionExpired(), readSessionStartedAt(), sessionStartedCookieOptions() (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (27): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+19 more)

### Community 40 - "Community 40"
Cohesion: 0.09
Nodes (39): POST(), POST(), siteUrl(), InviteBody, POST(), POST(), DELETE(), getSessionAndPermissions() (+31 more)

### Community 41 - "Community 41"
Cohesion: 0.07
Nodes (41): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+33 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.19
Nodes (14): DashboardLayout(), Home(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsContext, PermissionsProvider(), useCan() (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (11): MobilizeDialog(), emptyForm(), MobilizeGroupResourcesPanel(), MobilizeResourceRow, MobilizeResourceType, Props, ResourceForm, TYPE_ICONS (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.23
Nodes (12): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventPage(), CourseQuizBlock(), EventCategoryPill(), EventDescriptionHtml(), Props (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (23): GET(), parseBackHref(), parseTab(), PersonProfilePageContent(), formatAddress(), formatBirthday(), formatGender(), formatRole() (+15 more)

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (13): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker, AnnouncementDescriptionBody(), darkHtmlSx (+5 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.09
Nodes (27): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+19 more)

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (14): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), CoachMeetingBookingRecord (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.19
Nodes (16): MissionRankInfoDialog(), Props, loadMemberOnboardingSnapshot(), resolveCoachMeetingStepStatus(), resolveFirstMissionStepStatus(), LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience (+8 more)

### Community 53 - "Community 53"
Cohesion: 0.10
Nodes (27): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), MobilizeLayout(), MyGroupsPage(), JoinReq (+19 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.36
Nodes (5): POST(), normalizeAuthEmail(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError()

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (18): backup_env_files(), ensure_git_safe_directory(), ensure_repo_owned_by_deploy_owner(), free_listen_port(), kill_next_on_port(), kill_pids_on_port(), maybe_sudo(), PORT (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (4): child, { execSync, spawn }, path, port

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (9): PATCH(), PatchBody, PATCH(), escapeHtml(), notifyCertificateRequestReviewed(), NotifyParams, resolveUserContact(), CertificateRequestRow (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.09
Nodes (24): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+16 more)

### Community 60 - "Community 60"
Cohesion: 0.05
Nodes (69): DashboardWelcome(), CHAPTERS_ICONS, ChaptersProps, GROUP_TAB_ICONS, GROUP_TAB_SHORT_LABELS, GroupProps, MobilizeBottomNav(), MobilizeChaptersBottomNav() (+61 more)

### Community 61 - "Community 61"
Cohesion: 0.11
Nodes (18): GatheringDescriptionEditor(), MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, MobilizeSocialFeedShell() (+10 more)

### Community 62 - "Community 62"
Cohesion: 0.36
Nodes (6): GET(), extractTopicsFromText(), HubSidebarPayload, HubTopic, loadMobilizeHubSidebar(), SuggestedGroupRow

### Community 63 - "Community 63"
Cohesion: 0.17
Nodes (16): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+8 more)

### Community 64 - "Community 64"
Cohesion: 0.18
Nodes (29): RFC-5322, GET(), PATCH(), requireSuperAdmin(), GET(), GET(), getAppBaseUrl(), getGmailOAuthRedirectUri() (+21 more)

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (7): MissionsPage(), MissionBriefingPageInner(), MissionBriefingPage(), MissionsLanding(), JourneyMilestones, loadJourneyMilestones(), loadBriefingVideoUrl()

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.16
Nodes (17): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+9 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.52
Nodes (6): normalizeKeys(), ParsedUpload, parseUploadFile(), pickBestSheetRows(), rowsFromSheet(), stringifyCell()

### Community 76 - "Community 76"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 82 - "Community 82"
Cohesion: 0.20
Nodes (21): ProgressPageContent(), progressRoleLabel(), listDashboardUsersByIds(), listProfilesByIds(), graduateBadgeRoleFromRoles(), isUserCourseComplete(), loadCountableCourseSessionIds(), loadCourseSessionIds() (+13 more)

### Community 84 - "Community 84"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 85 - "Community 85"
Cohesion: 0.10
Nodes (36): POST(), GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx (+28 more)

### Community 86 - "Community 86"
Cohesion: 0.15
Nodes (16): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringForm(), GatheringStatus, SupabaseStaleSessionCleanup(), countPresenceUsers() (+8 more)

### Community 87 - "Community 87"
Cohesion: 0.10
Nodes (26): baseOpts, Chart, JourneyProgressAdminClient(), JourneyProgressRow, JourneyProgressStats, loadJourneyProgressBundle(), roleLabel(), ADMIN_ROLE_NAMES (+18 more)

### Community 88 - "Community 88"
Cohesion: 0.08
Nodes (39): POST(), ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, coerceQuizPayload(), CourseQuizFormEditor() (+31 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.23
Nodes (12): announcementPlainTextPreview(), emptyCta(), fromLocalDatetimeValue(), NotificationsAppClient(), Snack, toLocalDatetimeValue(), ANNOUNCEMENT_AUDIENCES, AnnouncementAudience (+4 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.06
Nodes (46): MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeGroupFeed(), Props, toUnifiedPost(), MobilizeHomeFeedClient() (+38 more)

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (9): ChapterStateBadge(), chapterStateInitials(), leaderPillSx, MobilizeGroupsBrowseTable(), Props, SubgroupAvatars(), MobilizeSubgroupBrief, mobilizeGroupInitials() (+1 more)

### Community 98 - "Community 98"
Cohesion: 0.27
Nodes (11): createPlyrRoot(), EventVideoPlyrDialogInner(), plyrControls, PlyrLike, looksLikeDirectMedia(), pickDailymotionEmbed(), pickVimeoId(), pickYoutubeId() (+3 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.20
Nodes (12): SignInEmailChangePanel(), SignInEmailChangePanelProps, ChangePasswordDialog(), HeaderAccountSettingsButton(), formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel() (+4 more)

### Community 101 - "Community 101"
Cohesion: 0.04
Nodes (58): capitalizeRole(), EventRow, formatMemberSince(), Group, GROUP_FEED_SUB_TABS, GroupDetailClient(), GroupFeedSubTab, MemberRow (+50 more)

### Community 102 - "Community 102"
Cohesion: 0.10
Nodes (40): Ctx, GET(), normalizeStateCode(), GET(), Ctx, DELETE(), loadMembership(), PATCH() (+32 more)

### Community 103 - "Community 103"
Cohesion: 0.40
Nodes (8): Ctx, POST(), ALLOWED_MIME, detectResourceDocumentExt(), extFromName(), isPdf(), ResourceDocumentExt, validateResourceDocument()

### Community 104 - "Community 104"
Cohesion: 0.14
Nodes (29): GET(), isIsoDate(), POST(), PostBody, chaptersForStateFilter(), chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed() (+21 more)

### Community 106 - "Community 106"
Cohesion: 0.09
Nodes (32): POST(), PATCH(), PatchBody, STATUSES, PATCH(), PatchBody, STATUSES, GET() (+24 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 111 - "CourseGraduateBadge.tsx"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 113 - "Community 113"
Cohesion: 0.16
Nodes (20): POST(), RouteCtx, rowToCampaign(), GET(), requireBroadcastSend(), executeBroadcastCampaign(), SendCampaignResult, AvailableProviders (+12 more)

### Community 119 - "parse-upload.ts"
Cohesion: 0.14
Nodes (23): ChapterRow, ChapterSortKey, ChaptersSection(), LeaderOption, StateSearchAutocomplete(), STATUS_LABEL, statusColor(), UsStateSearchAutocomplete() (+15 more)

### Community 120 - "EditCoursePageContent.tsx"
Cohesion: 0.21
Nodes (13): Body, POST(), POST(), GET(), GET(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity() (+5 more)

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 137 - "Community 137"
Cohesion: 0.06
Nodes (50): DashboardHomeContent(), hexToRgb(), MissionCardItem(), MISSIONS_WELCOME, phaseHoverShadow(), ChapterInviteShareDialog(), chapterInviteShareText(), Props (+42 more)

### Community 139 - "Community 139"
Cohesion: 0.67
Nodes (3): AR, lat, lng

### Community 140 - "Community 140"
Cohesion: 0.25
Nodes (9): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), AGE_BUCKETS, ageFromDob(), bucketLabel(), loadPeopleOverviewStats() (+1 more)

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 148 - "Community 148"
Cohesion: 0.22
Nodes (24): AK, lat, lng, NH, NJ, NM, NV, NY (+16 more)

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

### Community 196 - "ManualLogForm.tsx"
Cohesion: 0.12
Nodes (18): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY (+10 more)

## Knowledge Gaps
- **704 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+699 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `xlsx` connect `Community 31` to `Community 9`, `Community 75`, `Community 4`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 144`, `Community 147`, `Community 153`, `Community 154`, `Community 28`, `Community 31`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `Community 95`, `@mui/material-nextjs`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `createAdminClient()` connect `Community 40` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 10`, `Community 13`, `Community 14`, `Community 17`, `Community 22`, `Community 27`, `Community 32`, `Community 33`, `Community 35`, `Community 43`, `Community 45`, `Community 46`, `Community 58`, `Community 64`, `Community 82`, `Community 84`, `Community 85`, `Community 104`, `Community 106`, `Community 113`, `EditCoursePageContent.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _704 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1498612395929695 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.055944055944055944 - nodes in this community are weakly interconnected._