# Graph Report - dashboard  (2026-08-03)

## Corpus Check
- 771 files · ~367,222 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3556 nodes · 11884 edges · 224 communities (141 shown, 83 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d3e1429`
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
- page.tsx
- Community 101
- Community 102
- Community 103
- Community 104
- getMailTransportAndFrom
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- CourseGraduateBadge.tsx
- registry.ts
- Community 113
- loadMobilizeGroupCreatorPolicy
- Community 115
- route.ts
- Community 117
- MobilizeBottomNavBar.tsx
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
- training-feed.ts
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- nprogress
- Community 139
- Community 140
- Community 141
- Community 142
- DonationsSettingsClient.tsx
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
- Community 168
- Community 169
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- UserNotesAdminClient.tsx
- getServerAuth
- page.tsx
- Community 180
- page.tsx
- AL
- route.ts
- PersonProfilePageContent.tsx
- route.ts
- page.tsx
- route.ts
- Community 201
- Community 202
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
1. `createAdminClient()` - 288 edges
2. `requireApiAuth()` - 266 edges
3. `loadUserRoleNames()` - 263 edges
4. `can()` - 209 edges
5. `loadModulePermissions()` - 208 edges
6. `requireMobilizeRead()` - 154 edges
7. `isElevatedRole()` - 128 edges
8. `requireServerUser()` - 119 edges
9. `MODULE_SLUGS` - 114 edges
10. `createClient()` - 107 edges

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

## Communities (224 total, 83 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (27): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (99): GET(), parseRoleFilter(), GET(), GET(), GET(), DEFAULT_FORM_IDS, escapeRegex(), extractEntries() (+91 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (17): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (14): GET(), DashboardHomeContent(), listAllDashboardUsers(), includeReferenceInOverviewStatTotals(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit, sumReferenceTotals() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (7): AdminRolesPage(), CommunityPage(), CourseProgressPage(), FirstMissionsPage(), JourneyProgressPage(), ReportsPage(), DataPaneFallback()

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (17): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), displayNameFromUser() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (24): GET(), GET(), GET(), POST(), ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (15): MissionBriefingPageInner(), MissionBriefingPage(), JourneyMilestones, loadJourneyMilestones(), createAdminCompletedJourneySnapshot(), isAdminJourneySidebarAudience(), loadMemberOnboardingSnapshot(), resolveCoachMeetingStepStatus() (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (17): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (21): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.21
Nodes (24): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.17
Nodes (18): DashboardLayout(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsContext, PermissionsProvider(), useCan(), usePermissions() (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (17): MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, Props, EditorHandle (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (31): isPdf(), POST(), POST(), POST(), POST(), Ctx, POST(), POST() (+23 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (18): ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, listOnboardingMemberUserIds(), loadCoachMeetingStatusIndex(), loadCountableSessionIdsCached() (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (16): MobilizeChapterFeedBanner(), Props, US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), escapeRegExp(), normalizeUsStateFromText(), parseStateFromUsAddress(), ResolveStateInput (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (22): GET(), JoinReq, MobilizeNotificationsPage(), MobilizeChapterUpdatesPanel(), Props, EventNotificationCard(), JoinRequestCard(), MobilizeNotificationsClient() (+14 more)

### Community 22 - "Community 22"
Cohesion: 0.07
Nodes (66): PATCH(), DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET(), PATCH() (+58 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (17): ChangePasswordDialog(), HeaderSuperAdminProfileAvatar(), SOCIAL_MENU_ICONS, MobilizeSocialBottomNav(), RecommendedUserRow(), MobilizeSocialInternalNav(), NavItem, NavKey (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (31): AnnouncementsNavBadge(), DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS (+23 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (33): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+25 more)

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (33): CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey(), videoDurationStorageKey() (+25 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.31
Nodes (14): ProgressPageContent(), progressRoleLabel(), listDashboardUsersByIds(), listRoleNamesByUserIds(), graduateBadgeRoleFromRoles(), computeCourseCompletionRow(), progressRoleBucketFromSlugs(), ProgressRow (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (21): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+13 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.15
Nodes (20): GET(), executeBroadcastCampaign(), SendCampaignResult, AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders() (+12 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (24): Cell, Body, POST(), POST(), ALLOWED_KEYS, PATCH(), MobilizeSettingsPage(), AccessDenied() (+16 more)

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (22): GET(), POST(), GET(), POST(), POST(), GET(), GET(), Body (+14 more)

### Community 37 - "Community 37"
Cohesion: 0.19
Nodes (15): config, middleware(), POST(), POST(), clearSessionStartedCookie(), isAppSessionExpired(), readSessionStartedAt(), signInPasswordCandidates() (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (20): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+12 more)

### Community 40 - "Community 40"
Cohesion: 0.08
Nodes (55): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), POST() (+47 more)

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (45): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+37 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.14
Nodes (16): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo, ReportsPresenceDateRangeControls(), Chart, chartOpts (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.14
Nodes (12): AdBlockThumbnail(), blockLabel(), blockPreviewImageUrl(), MobilizeFeedAdsSettingsForm(), MobilizePolicySettingsForm(), MobilizeSettingsClient(), MobilizeFeedAdBlock, MobilizeFeedAdCarouselBlock (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.11
Nodes (27): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+19 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (23): GET(), parseBackHref(), parseTab(), PersonProfilePageContent(), formatAddress(), formatBirthday(), formatGender(), formatRole() (+15 more)

### Community 47 - "Community 47"
Cohesion: 0.09
Nodes (45): DELETE(), isCommunicationsAdmin(), PATCH(), DELETE(), PATCH(), GET(), isCommunicationsAdmin(), POST() (+37 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.10
Nodes (19): GET(), MobilizeAlertsClient(), MobilizeSocialHubContent(), Props, SocialHubContentTone, MobilizeSocialHubLayout(), Props, MobilizeSocialHubRightRail() (+11 more)

### Community 51 - "Community 51"
Cohesion: 0.18
Nodes (16): GET(), buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots() (+8 more)

### Community 52 - "Community 52"
Cohesion: 0.26
Nodes (10): MissionRankInfoDialog(), Props, LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience, missionRankDialogTitle(), MissionRankProgress, missionRanksForAudience() (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.07
Nodes (39): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), ChapterGroupsClient(), ChapterRow, GroupRow (+31 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.21
Nodes (14): chunkIds(), NotificationMenu(), NotificationRow, MobilizeNavNotificationsBadge(), EMPTY, notificationKeys(), useMobilizeNotifications(), MobilizeNotificationsPayload (+6 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (18): backup_env_files(), ensure_git_safe_directory(), ensure_repo_owned_by_deploy_owner(), free_listen_port(), kill_next_on_port(), kill_pids_on_port(), maybe_sudo(), PORT (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (4): child, { execSync, spawn }, path, port

### Community 58 - "Community 58"
Cohesion: 0.25
Nodes (11): POST(), ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience(), normalizeBroadcastAudience(), normalizeOptionalScopeId(), resolveBroadcastRecipients() (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.15
Nodes (17): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+9 more)

### Community 60 - "Community 60"
Cohesion: 0.06
Nodes (52): DashboardWelcome(), CHAPTERS_ICONS, ChaptersProps, GROUP_TAB_ICONS, GROUP_TAB_SHORT_LABELS, GroupProps, MobilizeBottomNav(), MobilizeChaptersBottomNav() (+44 more)

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (12): GET(), GET(), GroupRow, DuRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), MobilizeGroupBrowseExtras (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.24
Nodes (13): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), getZonedParts(), isThursdayNoonInTimeZone(), isWeeklyMembersPostWindow(), lastAutoFeedAt() (+5 more)

### Community 63 - "Community 63"
Cohesion: 0.13
Nodes (24): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+16 more)

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (34): RFC-5322, POST(), POST(), GET(), PATCH(), requireSuperAdmin(), GET(), GET() (+26 more)

### Community 65 - "Community 65"
Cohesion: 0.11
Nodes (31): countUsersRegistered(), GET(), baseOpts, Bucket, Chart, CourseCompletionRow, formatLabel(), formatStatusSlug() (+23 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.15
Nodes (18): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+10 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.18
Nodes (16): POST(), correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect() (+8 more)

### Community 76 - "Community 76"
Cohesion: 0.16
Nodes (22): GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx, GET() (+14 more)

### Community 82 - "Community 82"
Cohesion: 0.20
Nodes (11): LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY, ManualLogForm(), AuditRow, formatAuditDetails(), LogSortKey, LogsTable(), writeAuditLog() (+3 more)

### Community 84 - "Community 84"
Cohesion: 0.24
Nodes (9): hexToRgb(), phaseHoverShadow(), MISSION_DIFFICULTY_COLORS, MISSION_DIFFICULTY_LABELS, MISSION_PHASES, MissionCard, MissionDifficulty, MissionPhase (+1 more)

### Community 85 - "Community 85"
Cohesion: 0.14
Nodes (15): ChapterStateBadge(), chapterStateInitials(), leaderPillSx, MobilizeGroupsBrowseTable(), Props, SubgroupAvatars(), Props, PublicGroupActionBar() (+7 more)

### Community 86 - "Community 86"
Cohesion: 0.24
Nodes (15): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, blockTitleHtmlFromPlain(), blockTitlePlainFromHtml(), collectCourseBlockValidationIssues() (+7 more)

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (8): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS

### Community 88 - "Community 88"
Cohesion: 0.14
Nodes (25): GET(), PATCH(), PatchBody, GET(), PATCH(), chunkIdsForInQuery(), dashboardRowFromAuthUser(), DashboardUserListRow (+17 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.15
Nodes (12): feedAdImageSx, MobilizeFeedAdsCarousel(), Props, AdImageBlock(), MobilizeFeedAdsRail(), Props, MobilizeFeedHtml(), Props (+4 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.18
Nodes (11): MobilizeDialog(), emptyForm(), MobilizeGroupResourcesPanel(), MobilizeResourceRow, MobilizeResourceType, Props, ResourceForm, TYPE_ICONS (+3 more)

### Community 94 - "Community 94"
Cohesion: 0.15
Nodes (20): GET(), Ctx, POST(), Ctx, GET(), primaryRoleLabel(), GET(), POST() (+12 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.09
Nodes (39): MobilizeSectionEmptyState(), Props, MobilizeBookmarksClient(), MobilizeGroupFeed(), Props, toUnifiedPost(), MobilizeHomeFeedClient(), formatHandle() (+31 more)

### Community 97 - "Community 97"
Cohesion: 0.36
Nodes (9): countMobilizeChapterGroups(), countStartedMissions(), countUpcomingGatherings(), loadOverviewStats(), loadStatePopupStats(), normalizeStateCode(), OverviewScope, ReferenceAddition (+1 more)

### Community 98 - "Community 98"
Cohesion: 0.16
Nodes (16): ResetPasswordPage(), ForgotPasswordPage(), ChapterOption, RegisterPage(), MaintenancePage(), metadata, ArmyAuthShell(), authFloatingTextFieldSx (+8 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.14
Nodes (18): ChapterRow, ChapterSortKey, ChaptersSection(), LeaderOption, StateSearchAutocomplete(), STATUS_LABEL, statusColor(), UsStateSearchAutocomplete() (+10 more)

### Community 100 - "page.tsx"
Cohesion: 0.13
Nodes (23): InviteBody, POST(), displayNameForUser(), POST(), POST(), ALLOWED, DEMO_SHORTCODES, POST() (+15 more)

### Community 101 - "Community 101"
Cohesion: 0.06
Nodes (37): capitalizeRole(), EventRow, formatMemberSince(), Group, GROUP_FEED_SUB_TABS, GroupDetailClient(), GroupFeedSubTab, MemberRow (+29 more)

### Community 102 - "Community 102"
Cohesion: 0.33
Nodes (14): GET(), PUT(), cleanOptionalToken(), isSafeFeedAdHref(), isSafeFeedAdImageUrl(), loadMobilizeFeedAds(), parseBlockTitle(), parseCarouselBlock() (+6 more)

### Community 103 - "Community 103"
Cohesion: 0.21
Nodes (16): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+8 more)

### Community 104 - "Community 104"
Cohesion: 0.19
Nodes (22): GET(), isIsoDate(), POST(), PostBody, chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed(), insertCourseCompletedFeed() (+14 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.07
Nodes (47): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+39 more)

### Community 106 - "Community 106"
Cohesion: 0.29
Nodes (13): GET(), isBucket(), CourseQuizResultRow, CourseSessionProgressRow, fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket (+5 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 108 - "Community 108"
Cohesion: 0.17
Nodes (15): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+7 more)

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 110 - "Community 110"
Cohesion: 0.50
Nodes (5): MobilizeLayout(), MobilizeContentShell(), MobilizeNotificationsSoundWatcher(), MobilizeToastProvider(), canAccessMobilizeModule()

### Community 111 - "CourseGraduateBadge.tsx"
Cohesion: 0.27
Nodes (6): Props, EventRow(), formatEventShort(), PublicGroupEvent, PublicGroupProfileData, PublicGroupProfileView()

### Community 112 - "registry.ts"
Cohesion: 0.13
Nodes (18): AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog(), graduateDisplayName(), OVERLAY_REF, overlayMetrics(), formatCompactCount() (+10 more)

### Community 113 - "Community 113"
Cohesion: 0.36
Nodes (10): GET(), loadAutoCloseDays(), PUT(), requireSuperAdmin(), GET(), clampImageMaxCount(), clampImageMaxMb(), loadMobilizeImageUploadLimits() (+2 more)

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.35
Nodes (9): LoginFallback(), LoginForm(), LoginPage(), hasSeenHint(), HIGHLIGHT, LoginSignInHighlight(), markHintSeen(), showLoginSignInHighlight() (+1 more)

### Community 115 - "Community 115"
Cohesion: 0.48
Nodes (6): sendBroadcastEmail(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 116 - "route.ts"
Cohesion: 0.22
Nodes (8): countComments(), MobilizeSocialComments(), Props, SocialCommentNode, MobilizeSocialAuthor, MobilizeSocialReactionBar(), Props, ReactionCounts

### Community 117 - "Community 117"
Cohesion: 0.28
Nodes (14): displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle(), resolveCourseFinishedDisplay() (+6 more)

### Community 118 - "MobilizeBottomNavBar.tsx"
Cohesion: 0.29
Nodes (7): coerceQuizPayload(), CourseQuizFormEditor(), newQuestion(), normalizeQuestion(), Editor, GatheringDescriptionEditor(), Props

### Community 119 - "parse-upload.ts"
Cohesion: 0.40
Nodes (4): InviteFriendsBanner(), CourseIntroVideoBlock(), Props, ExternalTrainingCertificateBanner()

### Community 120 - "EditCoursePageContent.tsx"
Cohesion: 0.29
Nodes (7): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), useSyncedState()

### Community 121 - "Community 121"
Cohesion: 0.29
Nodes (10): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, InviteShareChannel, inviteShareChannelLabel() (+2 more)

### Community 122 - "page.tsx"
Cohesion: 0.24
Nodes (7): JourneyWelcomeDialog(), Props, RICH_CONTENT_SX, BriefingVideoAdmin(), BRIEFING_WELCOME, MissionBriefingLanding(), Props

### Community 124 - "Community 124"
Cohesion: 0.33
Nodes (9): MissionCardItem(), CUSTOM_PARTNER_LOGO_SIZES, MISSION_PARTNER_LOGOS, missionPartnerLogoCustomSize(), MissionPartnerLogoSize, missionPartnerLogoUrl(), missionPartnerLogoUsesTallSize(), partnerLogoHost() (+1 more)

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "Community 128"
Cohesion: 0.22
Nodes (18): LeadersPageContent(), PeoplePage(), PeoplePageContent(), isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES (+10 more)

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "page.tsx"
Cohesion: 0.42
Nodes (6): CourseSessionPage(), hostAllowsTrainingDebugQuery(), isTrainingDebugActive(), isTrainingDebugActiveClient(), isTrainingDebugParamAllowedHost(), parseTrainingDebugQueryParam()

### Community 131 - "Community 131"
Cohesion: 0.29
Nodes (8): barColorForPercent(), COLORS, geographyToStateCode(), HEAT_STOPS, heatFill(), ReportsStateDemographicMap(), RsmGeo, US_STATES

### Community 132 - "training-feed.ts"
Cohesion: 0.46
Nodes (4): POST(), Home(), getServerAuth(), setSessionStartedCookie()

### Community 133 - "Community 133"
Cohesion: 0.42
Nodes (6): playCommunityActionSoundAlert(), getAudioContext(), playBugleNote(), playMissionUpdateSound(), playMissionUpdateSoundAlert(), playSoundRepeated()

### Community 134 - "Community 134"
Cohesion: 0.62
Nodes (4): POST(), RouteCtx, rowToCampaign(), requireBroadcastSend()

### Community 135 - "Community 135"
Cohesion: 0.60
Nodes (4): GET(), POST(), stripHtml(), BROADCAST_CHANNELS

### Community 137 - "Community 137"
Cohesion: 0.18
Nodes (16): ActivityFeedRow, CommunityInActionFeed(), ChapterRow, drawerLikeScrollbarSx, NationalOverview(), UsaChapterActivityMap, isMemberOrLeader(), CommunityActivityFeedRow (+8 more)

### Community 138 - "nprogress"
Cohesion: 0.07
Nodes (55): Ctx, isApprovedMember(), POST(), buildCommentTree(), CommentNode, CommentRow, Ctx, GET() (+47 more)

### Community 140 - "Community 140"
Cohesion: 0.53
Nodes (4): SignInEmailChangePanel(), SignInEmailChangePanelProps, formatOtpResendCountdown(), useOtpResendCooldown()

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 148 - "Community 148"
Cohesion: 0.05
Nodes (76): AK, lat, lng, AL, lat, lng, AR, lat (+68 more)

### Community 149 - "Community 149"
Cohesion: 0.14
Nodes (6): ChaptersPage(), CourseBySlugPage(), CertificateRequestsPage(), EmailsPage(), EventCategoriesPage(), NotificationsPage()

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "Community 152"
Cohesion: 0.10
Nodes (23): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringStatus, assignmentSteps, checklist, IntroVideoAdminProps (+15 more)

### Community 168 - "Community 168"
Cohesion: 0.33
Nodes (3): ChapterMapInviteCta(), SharePlatform, SOCIAL_BUTTONS

### Community 169 - "Community 169"
Cohesion: 0.40
Nodes (5): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), PeopleOverviewStats

### Community 171 - "Community 171"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 172 - "Community 172"
Cohesion: 0.12
Nodes (34): Ctx, GET(), normalizeStateCode(), GET(), Ctx, DELETE(), loadMembership(), PATCH() (+26 more)

### Community 177 - "UserNotesAdminClient.tsx"
Cohesion: 0.43
Nodes (6): MobilizeBottomNavBar(), MobilizeBottomNavBarItem, NavItemButton(), navItemButtonSx(), Props, usePrimaryNavSlotLimit()

### Community 178 - "getServerAuth"
Cohesion: 0.48
Nodes (6): CITY_COORDS, cityLookupKey(), hashString(), jitterAroundCentroid(), resolveCityCoordinates(), STATE_CENTROIDS

### Community 180 - "Community 180"
Cohesion: 0.44
Nodes (6): Body, POST(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity(), loadUserDisplay()

### Community 185 - "route.ts"
Cohesion: 0.70
Nodes (4): GET(), parseFilter(), parseJourneyProgressSortAscending(), parseJourneyProgressSortKey()

### Community 188 - "route.ts"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

## Knowledge Gaps
- **706 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+701 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `xlsx` connect `Community 31` to `Community 9`, `Community 2`, `UserProfileDrawer.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 144`, `Community 147`, `Community 153`, `Community 154`, `Community 28`, `Community 31`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `Community 95`, `@mui/material-nextjs`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `createAdminClient()` connect `Community 40` to `Community 128`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 134`, `Community 135`, `Community 8`, `Community 6`, `Community 13`, `Community 14`, `Community 22`, `Community 29`, `Community 35`, `Community 36`, `Community 45`, `Community 46`, `Community 47`, `Community 51`, `Community 180`, `route.ts`, `Community 58`, `route.ts`, `Community 62`, `Community 64`, `Community 65`, `Community 76`, `Community 88`, `Community 94`, `page.tsx`, `Community 104`, `getMailTransportAndFrom`, `Community 106`, `CourseGraduateBadge.tsx`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _706 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06961629796275466 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `Community 7` be split into smaller, more focused modules?**
  _Cohesion score 0.10160427807486631 - nodes in this community are weakly interconnected._