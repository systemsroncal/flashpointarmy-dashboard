# Graph Report - dashboard  (2026-07-31)

## Corpus Check
- 769 files · ~365,218 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3557 nodes · 11795 edges · 235 communities (158 shown, 77 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `99423ef6`
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
- Community 180
- MissionUpdatesUnreadProvider.tsx
- AnnouncementTargetUsersField.tsx
- AL
- play-mission-update-sound.ts
- route.ts
- Community 189
- page.tsx
- ManualLogForm.tsx
- parse-upload.ts
- route.ts
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
1. `createAdminClient()` - 288 edges
2. `requireApiAuth()` - 266 edges
3. `loadUserRoleNames()` - 264 edges
4. `can()` - 209 edges
5. `loadModulePermissions()` - 208 edges
6. `requireMobilizeRead()` - 153 edges
7. `isElevatedRole()` - 128 edges
8. `requireServerUser()` - 119 edges
9. `MODULE_SLUGS` - 114 edges
10. `createClient()` - 108 edges

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

## Communities (235 total, 77 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (70): Ctx, isApprovedMember(), POST(), buildCommentTree(), CommentNode, CommentRow, Ctx, GET() (+62 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (27): POST(), POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (83): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+75 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (23): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.28
Nodes (15): GET(), parseRoleFilter(), GET(), GET(), GET(), CourseProgressExportRoleFilter, buildUserDirectoryExportRows(), chunkArray() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (8): AdminRolesPage(), ChaptersPage(), CommunityPage(), DonationsPage(), EditGatheringPage(), LeadersPage(), OrdersPage(), TrainingPage()

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (17): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), displayNameFromUser() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (11): POST(), ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience(), normalizeBroadcastAudience(), normalizeOptionalScopeId(), resolveBroadcastRecipients() (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (17): DashboardLayout(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsProvider(), DashboardUser, loadDashboardUser(), loadTrainingGraduateBadge() (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (23): GET(), InviteBody, POST(), POST(), POST(), displayNameForUser(), POST(), POST() (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

### Community 14 - "Community 14"
Cohesion: 0.32
Nodes (15): isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES, MEMBER_NAV_MODULES, SUB_ADMIN_NAV_MODULES, canAccessPeopleLeaders() (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (26): MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, countComments(), MobilizeSocialComments() (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (29): isPdf(), POST(), POST(), POST(), POST(), Ctx, POST(), POST() (+21 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (16): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (7): Ctx, POST(), Props, PublicMobilizeGroupPage(), PublicGroupProfileData, applyMobilizeAutoCloseInactive(), enrollmentAutoApproves()

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (19): JoinReq, MobilizeNotificationsPage(), MobilizeChapterUpdatesPanel(), Props, EventNotificationCard(), JoinRequestCard(), MobilizeNotificationsClient(), notificationCardSx() (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (61): Cell, PATCH(), DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET() (+53 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (20): feedAdImageSx, MobilizeFeedAdsCarousel(), Props, AdImageBlock(), MobilizeFeedAdsRail(), Props, AdBlockThumbnail(), blockLabel() (+12 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (29): DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV (+21 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (33): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+25 more)

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (16): MobilizeChapterFeedBanner(), Props, US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), escapeRegExp(), normalizeUsStateFromText(), parseStateFromUsAddress(), ResolveStateInput (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (26): GET(), GET(), ProgressPageContent(), progressRoleLabel(), LeadersPageContent(), listDashboardUsersByIds(), listProfilesByIds(), listRoleNamesByUserIds() (+18 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (21): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+13 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (12): GET(), GET(), GroupRow, DuRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), MobilizeGroupBrowseExtras (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.24
Nodes (7): MissionsPage(), MissionBriefingPageInner(), MissionBriefingPage(), MissionsLanding(), JourneyMilestones, loadJourneyMilestones(), loadBriefingVideoUrl()

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.07
Nodes (47): GET(), GET(), GET(), Ctx, GET(), isApprovedMember(), POST(), canManageGroupMembers() (+39 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (15): GET(), POST(), GET(), POST(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic(), isMemberOnboardingAudience() (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (15): config, middleware(), POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired() (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (19): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+11 more)

### Community 40 - "Community 40"
Cohesion: 0.08
Nodes (54): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), Body (+46 more)

### Community 41 - "Community 41"
Cohesion: 0.10
Nodes (36): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+28 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.14
Nodes (16): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo, ReportsPresenceDateRangeControls(), Chart, chartOpts (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (13): Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE(), GET(), PATCH() (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.09
Nodes (31): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+23 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (23): GET(), parseBackHref(), parseTab(), PersonProfilePageContent(), formatAddress(), formatBirthday(), formatGender(), formatRole() (+15 more)

### Community 47 - "Community 47"
Cohesion: 0.05
Nodes (67): DELETE(), isCommunicationsAdmin(), PATCH(), DELETE(), PATCH(), GET(), isCommunicationsAdmin(), POST() (+59 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.14
Nodes (16): ChangePasswordDialog(), HeaderAccountSettingsButton(), HeaderSuperAdminProfileAvatar(), AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog(), graduateDisplayName() (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (14): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), CoachMeetingBookingRecord (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.26
Nodes (10): MissionRankInfoDialog(), Props, LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience, missionRankDialogTitle(), MissionRankProgress, missionRanksForAudience() (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.09
Nodes (31): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), ChapterRow, GroupRow, ViewMode (+23 more)

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
Cohesion: 0.19
Nodes (15): PatchBody, ResolvedUserEmail, resolveUserEmailForDelivery(), escapeHtml(), notifyCertificateRequestReviewed(), NotifyParams, resolveUserContact(), approveCertificateRequestRecord() (+7 more)

### Community 59 - "Community 59"
Cohesion: 0.10
Nodes (28): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+20 more)

### Community 60 - "Community 60"
Cohesion: 0.05
Nodes (69): cards, MobilizeHomePage(), DashboardWelcome(), CHAPTERS_ICONS, ChaptersProps, GROUP_TAB_ICONS, GROUP_TAB_SHORT_LABELS, GroupProps (+61 more)

### Community 61 - "Community 61"
Cohesion: 0.18
Nodes (10): JourneyWelcomeDialog(), Props, RICH_CONTENT_SX, BriefingVideoAdmin(), BRIEFING_WELCOME, MissionBriefingLanding(), Props, MissionBriefingPlayer() (+2 more)

### Community 62 - "Community 62"
Cohesion: 0.15
Nodes (20): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), isThursdayNoonInTimeZone(), lastAutoFeedAt(), maybeInsertAutoFeed(), MIN_INTERVAL_MS (+12 more)

### Community 63 - "Community 63"
Cohesion: 0.14
Nodes (19): FirstMissionData, Props, Row, ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption (+11 more)

### Community 64 - "Community 64"
Cohesion: 0.18
Nodes (29): RFC-5322, GET(), PATCH(), requireSuperAdmin(), GET(), GET(), getAppBaseUrl(), getGmailOAuthRedirectUri() (+21 more)

### Community 65 - "Community 65"
Cohesion: 0.19
Nodes (19): Chart, chartBase, ComparisonPayload, ReportsRegistrationComparison(), daysInclusive(), defaultWeekComparisonRanges(), endOfUtcDay(), endOfUtcDayFromYmd() (+11 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.18
Nodes (14): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, formatCoachMeetingWhen(), fromDatetimeLocalValue(), OnboardingStatusChip(), toDatetimeLocalValue() (+6 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.13
Nodes (14): NewCourseForm(), Editor, GatheringDescriptionEditor(), Props, CatOpt, ChapterOpt, GatheringForm(), GatheringStatus (+6 more)

### Community 76 - "Community 76"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 82 - "Community 82"
Cohesion: 0.26
Nodes (10): POST(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError(), asAuthErrorLike(), clearStaleAuthSession(), getAuthUser(), getSupabaseSession() (+2 more)

### Community 84 - "Community 84"
Cohesion: 0.24
Nodes (9): hexToRgb(), phaseHoverShadow(), MISSION_DIFFICULTY_COLORS, MISSION_DIFFICULTY_LABELS, MISSION_PHASES, MissionCard, MissionDifficulty, MissionPhase (+1 more)

### Community 85 - "Community 85"
Cohesion: 0.14
Nodes (25): GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx, GET() (+17 more)

### Community 86 - "Community 86"
Cohesion: 0.15
Nodes (17): ChapterOption, RegisterPage(), authFloatingTextFieldSx, SignInEmailChangePanel(), SignInEmailChangePanelProps, FirstLoginPasswordGate(), SupabaseStaleSessionCleanup(), countPresenceUsers() (+9 more)

### Community 87 - "Community 87"
Cohesion: 0.16
Nodes (18): matchesStateChapterFilter(), ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, loadCoachMeetingStatusIndex(), loadCountableSessionIdsCached() (+10 more)

### Community 88 - "Community 88"
Cohesion: 0.18
Nodes (16): POST(), correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect() (+8 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.24
Nodes (15): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, blockTitleHtmlFromPlain(), blockTitlePlainFromHtml(), collectCourseBlockValidationIssues() (+7 more)

### Community 94 - "Community 94"
Cohesion: 0.19
Nodes (13): Body, POST(), chunkIdsForInQuery(), dashboardRowFromAuthUser(), DashboardUserListRow, listDashboardUsersByIdsWithAuthFallback(), listUserRoleJoinsByUserIds(), ProfileMailRow (+5 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.06
Nodes (50): MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeGroupFeed(), Props, toUnifiedPost(), MobilizeHomeFeedClient() (+42 more)

### Community 97 - "Community 97"
Cohesion: 0.25
Nodes (9): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS (+1 more)

### Community 98 - "Community 98"
Cohesion: 0.14
Nodes (22): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), MaintenancePage(), metadata, ArmyAuthShell() (+14 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.13
Nodes (21): ChapterRow, ChapterSortKey, ChaptersSection(), LeaderOption, StateSearchAutocomplete(), STATUS_LABEL, statusColor(), barColorForPercent() (+13 more)

### Community 100 - "page.tsx"
Cohesion: 0.33
Nodes (9): GET(), PATCH(), GET(), enrichPersonNames(), getPersonProfileNoteById(), loadPersonNotesAdminList(), personDisplayName(), searchPersonUserIds() (+1 more)

### Community 101 - "Community 101"
Cohesion: 0.04
Nodes (59): capitalizeRole(), EventRow, formatMemberSince(), Group, GROUP_FEED_SUB_TABS, GroupDetailClient(), GroupFeedSubTab, MemberRow (+51 more)

### Community 102 - "Community 102"
Cohesion: 0.09
Nodes (41): Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE(), GET(), PATCH() (+33 more)

### Community 103 - "Community 103"
Cohesion: 0.22
Nodes (15): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+7 more)

### Community 104 - "Community 104"
Cohesion: 0.18
Nodes (24): GET(), isIsoDate(), POST(), PostBody, chaptersForStateFilter(), chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed() (+16 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.33
Nodes (9): MissionCardItem(), CUSTOM_PARTNER_LOGO_SIZES, MISSION_PARTNER_LOGOS, missionPartnerLogoCustomSize(), MissionPartnerLogoSize, missionPartnerLogoUrl(), missionPartnerLogoUsesTallSize(), partnerLogoHost() (+1 more)

### Community 106 - "Community 106"
Cohesion: 0.37
Nodes (11): GET(), isBucket(), fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket, enumerateBucketLabels(), pad2() (+3 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 108 - "Community 108"
Cohesion: 0.10
Nodes (22): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+14 more)

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 111 - "CourseGraduateBadge.tsx"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 112 - "registry.ts"
Cohesion: 0.33
Nodes (14): GET(), PUT(), cleanOptionalToken(), isSafeFeedAdHref(), isSafeFeedAdImageUrl(), loadMobilizeFeedAds(), parseBlockTitle(), parseCarouselBlock() (+6 more)

### Community 113 - "Community 113"
Cohesion: 0.16
Nodes (20): executeBroadcastCampaign(), SendCampaignResult, sendBroadcastSms(), Branding, BroadcastShortcodes, renderBroadcastEmail(), renderBroadcastSms(), replaceShortcodes() (+12 more)

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.16
Nodes (16): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+8 more)

### Community 115 - "Community 115"
Cohesion: 0.18
Nodes (11): MobilizeDialog(), emptyForm(), MobilizeGroupResourcesPanel(), MobilizeResourceRow, MobilizeResourceType, Props, ResourceForm, TYPE_ICONS (+3 more)

### Community 116 - "route.ts"
Cohesion: 0.57
Nodes (5): POST(), RouteCtx, rowToCampaign(), requireBroadcastSend(), BroadcastCampaignRow

### Community 117 - "Community 117"
Cohesion: 0.28
Nodes (14): displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle(), resolveCourseFinishedDisplay() (+6 more)

### Community 118 - "MobilizeBottomNavBar.tsx"
Cohesion: 0.57
Nodes (5): canManageEvents(), Ctx, GET(), isApprovedMember(), POST()

### Community 119 - "parse-upload.ts"
Cohesion: 0.42
Nodes (6): GET(), AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders()

### Community 120 - "EditCoursePageContent.tsx"
Cohesion: 0.17
Nodes (15): Body, POST(), POST(), GET(), GET(), Body, PATCH(), chapterStateFromProfile() (+7 more)

### Community 121 - "Community 121"
Cohesion: 0.33
Nodes (9): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, inviteShareChannelLabel(), isInviteShareChannel() (+1 more)

### Community 122 - "page.tsx"
Cohesion: 0.16
Nodes (23): POST(), POST(), POST(), DELETE(), getSessionAndPermissions(), PATCH(), PatchBody, PATCH() (+15 more)

### Community 124 - "Community 124"
Cohesion: 0.48
Nodes (6): sendBroadcastEmail(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "Community 128"
Cohesion: 0.67
Nodes (3): GET(), displayNameFromUser(), fetchMobilizeNotifications()

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "page.tsx"
Cohesion: 0.60
Nodes (3): NotificationsPageContent(), CommunicationsNavTabs(), TABS

### Community 132 - "training-feed.ts"
Cohesion: 0.70
Nodes (4): coerceQuizPayload(), CourseQuizFormEditor(), newQuestion(), normalizeQuestion()

### Community 134 - "Community 134"
Cohesion: 0.13
Nodes (15): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY (+7 more)

### Community 136 - "Community 136"
Cohesion: 0.27
Nodes (8): areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), hasAutoTourCompleted(), markAutoTourCompleted(), markTourStepIdsSeen(), readRaw(), storageKey()

### Community 137 - "Community 137"
Cohesion: 0.15
Nodes (18): ActivityFeedRow, CommunityInActionFeed(), ChapterRow, drawerLikeScrollbarSx, NationalOverview(), UsaChapterActivityMap, isMemberOrLeader(), CommunityActivityFeedRow (+10 more)

### Community 138 - "nprogress"
Cohesion: 0.24
Nodes (6): ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption, ConversationSummary, DirectMessageRow

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
Cohesion: 0.18
Nodes (31): AK, lat, lng, MN, MO, MS, MT, NC (+23 more)

### Community 149 - "Community 149"
Cohesion: 0.11
Nodes (9): AdminsPage(), CourseProgressPage(), NewCoursePage(), DonatePage(), GatheringDetailPage(), LogsPage(), NotificationsPage(), SubscriptionsPage() (+1 more)

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "Community 152"
Cohesion: 0.50
Nodes (5): MobilizeLayout(), MobilizeContentShell(), MobilizeNotificationsSoundWatcher(), MobilizeToastProvider(), canAccessMobilizeModule()

### Community 155 - "Community 155"
Cohesion: 0.12
Nodes (15): MobilizeBottomNavBar(), MobilizeBottomNavBarItem, NavItemButton(), navItemButtonSx(), Props, usePrimaryNavSlotLimit(), MobilizeProfileSidebarCard(), MobilizeRecommendationsCard() (+7 more)

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

### Community 178 - "Community 178"
Cohesion: 0.33
Nodes (3): ChapterMapInviteCta(), SharePlatform, SOCIAL_BUTTONS

### Community 180 - "Community 180"
Cohesion: 0.50
Nodes (3): InviteFriendsBanner(), CourseIntroVideoBlock(), Props

### Community 181 - "MissionUpdatesUnreadProvider.tsx"
Cohesion: 0.23
Nodes (11): AnnouncementsNavBadge(), MissionUpdatesNavIcon(), MissionUpdatesUnreadContext, MissionUpdatesUnreadContextValue, MissionUpdatesUnreadProvider(), useMissionUpdatesUnread(), NotificationsDrawerUnreadCount(), getAudioContext() (+3 more)

### Community 183 - "AnnouncementTargetUsersField.tsx"
Cohesion: 0.45
Nodes (7): GET(), DashboardHomeContent(), includeReferenceInOverviewStatTotals(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit, sumReferenceTotals()

### Community 184 - "AL"
Cohesion: 0.67
Nodes (3): AL, lat, lng

### Community 188 - "route.ts"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 198 - "parse-upload.ts"
Cohesion: 0.52
Nodes (6): normalizeKeys(), ParsedUpload, parseUploadFile(), pickBestSheetRows(), rowsFromSheet(), stringifyCell()

### Community 200 - "route.ts"
Cohesion: 0.70
Nodes (4): GET(), parseFilter(), parseJourneyProgressSortAscending(), parseJourneyProgressSortKey()

### Community 203 - "Community 203"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

## Knowledge Gaps
- **723 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+718 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **77 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `xlsx` connect `Community 31` to `Community 9`, `Community 4`, `parse-upload.ts`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 144`, `Community 147`, `Community 153`, `Community 154`, `Community 28`, `Community 31`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `Community 95`, `@mui/material-nextjs`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `createAdminClient()` connect `Community 40` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 11`, `Community 13`, `Community 20`, `Community 22`, `Community 29`, `Community 35`, `Community 45`, `Community 46`, `Community 47`, `AnnouncementTargetUsersField.tsx`, `Community 58`, `route.ts`, `Community 62`, `Community 64`, `route.ts`, `Community 85`, `Community 94`, `page.tsx`, `Community 104`, `Community 106`, `route.ts`, `MobilizeBottomNavBar.tsx`, `EditCoursePageContent.tsx`, `page.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _723 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.054945054945054944 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1332099907493062 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08928231486769465 - nodes in this community are weakly interconnected._