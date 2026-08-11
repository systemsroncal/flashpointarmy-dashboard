# Graph Report - dashboard  (2026-07-15)

## Corpus Check
- 675 files · ~323,056 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3154 nodes · 10365 edges · 257 communities (174 shown, 83 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fffa07b8`
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
- ManualLogForm.tsx
- Community 197
- page.tsx
- certificate-requests.ts
- certificate-requests-admin-list.ts
- Community 201
- Community 202
- Community 203
- UserProfileDrawer.tsx
- training-feed.ts
- Community 206
- Community 207
- eslint-config-next
- Community 209
- @fortawesome/fontawesome-svg-core
- Community 211
- @fortawesome/free-solid-svg-icons
- us-city-coordinates.ts
- route.ts
- @fortawesome/react-fontawesome
- CourseGridClient.tsx
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
- PermissionsContext.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `createAdminClient()` - 267 edges
2. `requireApiAuth()` - 249 edges
3. `loadUserRoleNames()` - 242 edges
4. `can()` - 194 edges
5. `loadModulePermissions()` - 191 edges
6. `requireMobilizeRead()` - 128 edges
7. `isElevatedRole()` - 122 edges
8. `requireServerUser()` - 115 edges
9. `MODULE_SLUGS` - 108 edges
10. `createClient()` - 105 edges

## Surprising Connections (you probably didn't know these)
- `middleware()` --calls--> `getSupabaseSession()`  [EXTRACTED]
  middleware.ts → src/utils/supabase/middleware.ts
- `buildXlsxBuffer()` --references--> `xlsx`  [EXTRACTED]
  src/lib/export/xlsx-buffer.ts → package.json
- `parseUploadFile()` --references--> `xlsx`  [EXTRACTED]
  src/lib/import/parse-upload.ts → package.json
- `middleware()` --calls--> `isMaintenanceExemptPath()`  [EXTRACTED]
  middleware.ts → src/lib/maintenance.ts
- `middleware()` --calls--> `isMaintenanceMode()`  [EXTRACTED]
  middleware.ts → src/lib/maintenance.ts

## Import Cycles
- None detected.

## Communities (257 total, 83 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (12): POST(), writeAuditLog(), normalizeAuthEmail(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError(), asAuthErrorLike(), clearStaleAuthSession() (+4 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (28): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (83): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+75 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (18): fetchPresenceRowsInRange(), GET(), PresenceRow, chunkIdsForInQuery(), cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (30): GET(), GET(), GET(), GET(), POST(), parseBackHref(), parseTab(), PersonProfilePageContent() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (6): AdminRolesPage(), BroadcastTemplatesPage(), CommunityPage(), CourseProgressPage(), LeadersPage(), DataPaneFallback()

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (21): Body, POST(), GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, AdminsPageContent() (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (19): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), MaintenancePage(), metadata, ArmyAuthShell() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (29): RFC-5322, GET(), PATCH(), requireSuperAdmin(), GET(), GET(), getAppBaseUrl(), getGmailOAuthRedirectUri() (+21 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (22): ChapterRow, drawerLikeScrollbarSx, NationalOverview(), UsaChapterActivityMap, CommunityActivityFeedRow, loadCommunityActivityFeed(), mapFeedRows(), isChapterMapInviteCtaEnabled() (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (17): Props, PublicMobilizeGroupPage(), EventRow(), formatEventShort(), PublicGroupEvent, PublicGroupProfileData, PublicGroupProfileView(), US_STATE_FLAG_URL_BY_FIPS (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (14): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventPage(), accept, GatheringImageFields(), uploadToGatheringsBucket(), EventCategoryPill() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (21): POST(), POST(), siteUrl(), InviteBody, POST(), displayNameForUser(), POST(), siteUrl() (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (44): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), Body (+36 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (25): isPdf(), POST(), POST(), POST(), Ctx, POST(), POST(), POST() (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (35): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, OnboardingStatusWithInfo(), Props, buildSteps(), JourneyStep (+27 more)

### Community 20 - "Community 20"
Cohesion: 0.27
Nodes (11): createPlyrRoot(), EventVideoPlyrDialogInner(), plyrControls, PlyrLike, looksLikeDirectMedia(), pickDailymotionEmbed(), pickVimeoId(), pickYoutubeId() (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (49): GET(), MobilizeLayout(), JoinReq, MobilizeNotificationsPage(), ActivityFeedRow, CommunityInActionFeed(), displayFeedTitle(), englishCategoryLabel() (+41 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (19): GET(), Ctx, POST(), Ctx, GET(), primaryRoleLabel(), GET(), POST() (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.23
Nodes (12): POST(), ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience(), normalizeBroadcastAudience(), normalizeOptionalScopeId(), resolveBroadcastRecipients() (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (21): AnnouncementsNavBadge(), ChangePasswordDialog(), DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV (+13 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (16): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (59): Cell, PATCH(), Body, POST(), DELETE(), DELETE(), GET(), DELETE() (+51 more)

### Community 28 - "Community 28"
Cohesion: 0.23
Nodes (13): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker, AnnouncementDescriptionBody(), darkHtmlSx (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (43): Ctx, isApprovedMember(), POST(), buildCommentTree(), CommentNode, CommentRow, Ctx, GET() (+35 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (21): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+13 more)

### Community 31 - "Community 31"
Cohesion: 0.30
Nodes (10): DashboardLayout(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsProvider(), DashboardUser, loadDashboardUser(), loadTrainingGraduateBadge() (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (8): GET(), GET(), GroupRow, enrichMobilizeGroupsBrowse(), fullNameFromRow(), boundingBoxForRadiusKm(), deg2rad(), haversineKm()

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (13): GET(), isBucket(), CourseQuizResultRow, CourseSessionProgressRow, fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (10): GET(), GET(), Ctx, GET(), isApprovedMember(), POST(), attachGroupNames(), fetchMobilizeEventsInRange() (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (14): POST(), RouteCtx, rowToCampaign(), executeBroadcastCampaign(), SendCampaignResult, sendBroadcastSms(), Branding, BroadcastShortcodes (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (14): config, middleware(), POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired() (+6 more)

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
Cohesion: 0.07
Nodes (53): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+45 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (17): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+9 more)

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (6): MobilizeProfilePageShell(), Props, Tab, flashpointTheme, mobilizePageTheme, mobilizePanelTheme

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (12): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 47 - "Community 47"
Cohesion: 0.35
Nodes (11): GET(), isIsoDate(), POST(), PostBody, notifyCertificateRequestSubmitted(), CertListStatus, loadCertificateRequestStatsRows(), parseCertSortKey() (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.12
Nodes (19): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+11 more)

### Community 51 - "Community 51"
Cohesion: 0.20
Nodes (16): Ctx, GET(), isApprovedMember(), POST(), GET(), Ctx, POST(), isValidAnnouncementImagePath() (+8 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (17): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+9 more)

### Community 53 - "Community 53"
Cohesion: 0.07
Nodes (28): EventRow, Group, MemberRow, Membership, MessageRow, MobilizeGroupDetailPage(), MobilizeGroupReportsPanel(), Props (+20 more)

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
Cohesion: 0.18
Nodes (13): ChapterRow, ChapterSortKey, ChaptersSection(), LeaderOption, StateSearchAutocomplete(), STATUS_LABEL, statusColor(), UsStateSearchAutocomplete() (+5 more)

### Community 59 - "Community 59"
Cohesion: 0.36
Nodes (8): compareRows(), CourseProgressRow, CourseProgressSortKey, CourseProgressUsersTable(), initialsFromLabel(), pctForRow(), progressColor(), ProgressRoleBucket

### Community 60 - "Community 60"
Cohesion: 0.09
Nodes (33): capitalizeRole(), formatMemberSince(), GroupDetailClient(), startOfMonth(), MOBILIZE_GROUP_TAB_ICONS, MOBILIZE_GROUP_TAB_NAV_SX, MobilizeGroupSidebarTabs(), NAV_ITEM_TOUCH_SX (+25 more)

### Community 61 - "Community 61"
Cohesion: 0.13
Nodes (17): MobilizeFeedHtml(), Props, RecommendedUserRow(), countComments(), MobilizeSocialComments(), Props, SocialCommentNode, CommentConfig (+9 more)

### Community 62 - "Community 62"
Cohesion: 0.30
Nodes (14): GET(), POST(), GET(), POST(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic(), isMemberOnboardingAudience() (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.11
Nodes (26): PATCH(), PatchBody, STATUSES, PATCH(), PatchBody, STATUSES, Body, POST() (+18 more)

### Community 64 - "Community 64"
Cohesion: 0.08
Nodes (26): hexToRgb(), MissionCardItem(), MISSIONS_WELCOME, phaseHoverShadow(), ChapterInviteShareDialog(), chapterInviteShareText(), Props, shareHref() (+18 more)

### Community 65 - "Community 65"
Cohesion: 0.09
Nodes (38): POST(), ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, coerceQuizPayload(), CourseQuizFormEditor() (+30 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (3): cards, MobilizeHomePage(), MobilizeNavItem

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.11
Nodes (18): DeliverySummary, EmailDeliverySettingsPanel(), Branding, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex(), PREVIEW_SHORTCODES (+10 more)

### Community 76 - "Community 76"
Cohesion: 0.14
Nodes (14): BrowseMode, BrowseTab, GroupRow, MobilizeMapPageContent(), MobilizeMapView, OriginMode, MobilizeMapPage(), MOBILIZE_EVENT_TYPES (+6 more)

### Community 82 - "Community 82"
Cohesion: 0.16
Nodes (21): GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx, GET() (+13 more)

### Community 84 - "Community 84"
Cohesion: 0.26
Nodes (8): MissionsPage(), MissionBriefingPageInner(), MissionBriefingPage(), MissionsLanding(), JourneyMilestones, loadJourneyMilestones(), loadMemberOnboardingSnapshot(), loadBriefingVideoUrl()

### Community 85 - "Community 85"
Cohesion: 0.53
Nodes (5): graduateBadgeRoleFromRoles(), loadCountableCourseSessionIds(), loadCourseSessionIds(), loadTrainingGraduateBadgesForUsers(), UserRoleRow

### Community 86 - "Community 86"
Cohesion: 0.11
Nodes (26): Ctx, DELETE(), GET(), PATCH(), canManageGroupMembers(), Ctx, DELETE(), PATCH() (+18 more)

### Community 87 - "Community 87"
Cohesion: 0.09
Nodes (28): baseOpts, Chart, JourneyProgressAdminClient(), matchesStateChapterFilter(), JourneyProgressRow, JourneyProgressStats, loadJourneyProgressBundle(), roleLabel() (+20 more)

### Community 88 - "Community 88"
Cohesion: 0.17
Nodes (17): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), MyGroupsPage(), MobilizeAnnouncementImagePicker(), Props (+9 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.44
Nodes (6): Body, POST(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity(), loadUserDisplay()

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.19
Nodes (9): BiblicalCitizenshipProgressPage(), CoachesSettingsInner(), CoachesSettingsPage(), CoachesSettingsClient(), ApiAuthOk, ApiAuthResult, ApiSessionWithPermissions, ServerAuthResult (+1 more)

### Community 94 - "Community 94"
Cohesion: 0.42
Nodes (6): GET(), AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders()

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.12
Nodes (25): MobilizeSectionEmptyState(), Props, MobilizeGroupFeed(), Props, toUnifiedPost(), MobilizeHomeFeedClient(), MobilizeMemberProfileClient(), ProfilePayload (+17 more)

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (11): MissionRankInfoDialog(), Props, LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience, missionRankDialogTitle(), MissionRankProgress, missionRanksForAudience() (+3 more)

### Community 98 - "Community 98"
Cohesion: 0.18
Nodes (17): GET(), parseRoleFilter(), GET(), GET(), GET(), EditCoursePageContent(), NewCoursePageContent(), JourneyProgressPageContent() (+9 more)

### Community 99 - "Community 99"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 100 - "Community 100"
Cohesion: 0.20
Nodes (14): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+6 more)

### Community 101 - "Community 101"
Cohesion: 0.23
Nodes (12): announcementPlainTextPreview(), emptyCta(), fromLocalDatetimeValue(), NotificationsAppClient(), Snack, toLocalDatetimeValue(), ANNOUNCEMENT_AUDIENCES, AnnouncementAudience (+4 more)

### Community 102 - "Community 102"
Cohesion: 0.14
Nodes (24): Ctx, DELETE(), GET(), PATCH(), canManageEvents(), Ctx, GET(), isApprovedMember() (+16 more)

### Community 103 - "Community 103"
Cohesion: 0.22
Nodes (15): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+7 more)

### Community 104 - "Community 104"
Cohesion: 0.18
Nodes (14): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+6 more)

### Community 105 - "Community 105"
Cohesion: 0.22
Nodes (11): ReportsPresenceDateRangeControls(), Chart, chartOpts, formatDayLabel(), formatTrend(), rangeLabel(), ReportsPresenceSection(), StatCardProps (+3 more)

### Community 106 - "Community 106"
Cohesion: 0.18
Nodes (10): CourseIntroVideoBlock(), Props, ExternalTrainingCertificateBanner(), Props, assignmentSteps, checklist, IntroVideoAdminProps, Props (+2 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 111 - "Community 111"
Cohesion: 0.20
Nodes (13): POST(), GET(), GET(), Body, PATCH(), POST(), isMissionBriefingAudience(), loadMissionBriefingProgress() (+5 more)

### Community 112 - "Community 112"
Cohesion: 0.52
Nodes (6): normalizeKeys(), ParsedUpload, parseUploadFile(), pickBestSheetRows(), rowsFromSheet(), stringifyCell()

### Community 113 - "Community 113"
Cohesion: 0.48
Nodes (6): sendBroadcastEmail(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 114 - "Community 114"
Cohesion: 0.67
Nodes (3): NH, lat, lng

### Community 116 - "Community 116"
Cohesion: 0.35
Nodes (7): ChapterOption, RegisterPage(), authFloatingTextFieldSx, SignInEmailChangePanel(), SignInEmailChangePanelProps, formatOtpResendCountdown(), useOtpResendCooldown()

### Community 117 - "Community 117"
Cohesion: 0.38
Nodes (7): GET(), CoachMeetingBookingRecord, composeCoachingAtIso(), isSlotOccupied(), occupiedSlotLabelsForDate(), rangesOverlap(), slotLabelToMinutes()

### Community 118 - "Community 118"
Cohesion: 0.40
Nodes (6): formatEventDateTime(), PublicEventsPage(), EventListItem, EventsListClient(), formatEventDateTime(), formatEventLocationLine()

### Community 119 - "Community 119"
Cohesion: 0.13
Nodes (20): GET(), POST(), POST(), formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH() (+12 more)

### Community 120 - "Community 120"
Cohesion: 0.27
Nodes (4): DashboardWelcome(), isNationalOverviewHome(), RoleWelcomeVideoPrompt(), useDashboardUser()

### Community 121 - "Community 121"
Cohesion: 0.31
Nodes (8): barColorForPercent(), COLORS, geographyToStateCode(), HEAT_STOPS, heatFill(), ReportsStateDemographicMap(), RsmGeo, usStateById()

### Community 122 - "Community 122"
Cohesion: 0.08
Nodes (29): ChapterGroupsClient(), ChapterRow, GroupRow, MobilizeChapterFeedBanner(), Props, MobilizeGroupListedSwitch(), Props, ChapterStateBadge() (+21 more)

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "Community 130"
Cohesion: 0.29
Nodes (7): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), useSyncedState()

### Community 133 - "Community 133"
Cohesion: 0.17
Nodes (15): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringStatus, SupabaseStaleSessionCleanup(), countPresenceUsers(), DashboardPresenceContext (+7 more)

### Community 135 - "Community 135"
Cohesion: 0.43
Nodes (7): buildUserDirectoryExportRows(), chunkArray(), collectUserIdsForRole(), fetchChapterMap(), fetchUsersByIds(), filterUserIdsByChapterScope(), UserDirectoryExportKind

### Community 136 - "Community 136"
Cohesion: 0.36
Nodes (8): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), coachMeetingScheduleLabel()

### Community 139 - "Community 139"
Cohesion: 0.67
Nodes (3): AR, lat, lng

### Community 140 - "Community 140"
Cohesion: 0.25
Nodes (9): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), AGE_BUCKETS, ageFromDob(), bucketLabel(), loadPeopleOverviewStats() (+1 more)

### Community 143 - "Community 143"
Cohesion: 0.20
Nodes (21): ProgressPageContent(), progressRoleLabel(), dashboardRowFromAuthUser(), DashboardUserListRow, listDashboardUsersByIds(), listProfilesByIds(), listRoleNamesByUserIds(), listUserRoleJoinsByUserIds() (+13 more)

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 148 - "Community 148"
Cohesion: 0.44
Nodes (10): AK, lat, lng, UT, VA, VT, WA, WI (+2 more)

### Community 149 - "Community 149"
Cohesion: 0.17
Nodes (5): ChaptersPage(), BroadcastHistoryPage(), EditCoursePage(), NewGatheringPage(), LogsPage()

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
Cohesion: 0.24
Nodes (7): AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog(), graduateDisplayName(), OVERLAY_REF, overlayMetrics()

### Community 196 - "ManualLogForm.tsx"
Cohesion: 0.28
Nodes (7): LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY, ManualLogForm(), AuditRow, formatAuditDetails(), LogSortKey, LogsTable()

### Community 197 - "Community 197"
Cohesion: 0.36
Nodes (5): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo

### Community 199 - "certificate-requests.ts"
Cohesion: 0.36
Nodes (7): isUserCourseComplete(), userCompletedAllSessions(), CertificateRequestStatus, ExternalCertificateCtaState, loadExternalCertificateCtaState(), shouldShowExternalCertificatePrompt(), userHasPendingCertificateRequest()

### Community 200 - "certificate-requests-admin-list.ts"
Cohesion: 0.43
Nodes (7): DB_SORTABLE, enrichCertificateRequests(), EnrichedCertificateRequest, listCertificateRequestsAdminPage(), matchesSearch(), resolveChapterUserIds(), sortEnriched()

### Community 204 - "UserProfileDrawer.tsx"
Cohesion: 0.52
Nodes (6): formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer()

### Community 205 - "training-feed.ts"
Cohesion: 0.62
Nodes (6): chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed(), insertCourseCompletedFeed(), insertCourseSessionCompletedFeed(), formatPrivacyName()

### Community 213 - "us-city-coordinates.ts"
Cohesion: 0.48
Nodes (6): CITY_COORDS, cityLookupKey(), hashString(), jitterAroundCentroid(), resolveCityCoordinates(), STATE_CENTROIDS

### Community 214 - "route.ts"
Cohesion: 0.60
Nodes (4): GET(), POST(), stripHtml(), BROADCAST_CHANNELS

### Community 216 - "CourseGridClient.tsx"
Cohesion: 0.33
Nodes (5): CourseGridClient(), SESSION_CARD_TOUCH_SX, SessionCard(), SessionCardModel, TRAINING_LESSONS_PANEL_SX

### Community 250 - "PermissionsContext.tsx"
Cohesion: 0.50
Nodes (4): PermissionsContext, useCan(), usePermissions(), CrudKey

## Knowledge Gaps
- **687 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+682 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `xlsx` connect `Community 55` to `Community 112`, `Community 9`, `Community 98`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 144`, `Community 147`, `Community 153`, `Community 154`, `Community 40`, `Community 55`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `Community 95`, `@mui/material-nextjs`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `createAdminClient()` connect `Community 14` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 10`, `Community 12`, `Community 13`, `Community 15`, `Community 143`, `Community 17`, `Community 23`, `Community 27`, `Community 31`, `Community 33`, `Community 35`, `Community 36`, `Community 47`, `Community 63`, `Community 82`, `route.ts`, `Community 86`, `Community 91`, `Community 98`, `Community 102`, `Community 111`, `Community 117`, `Community 118`, `Community 119`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _687 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14627659574468085 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08928231486769465 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.10975609756097561 - nodes in this community are weakly interconnected._