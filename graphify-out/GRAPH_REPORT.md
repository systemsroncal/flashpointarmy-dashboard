# Graph Report - dashboard  (2026-08-14)

## Corpus Check
- 829 files · ~403,602 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3761 nodes · 12658 edges · 225 communities (141 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `613b3558`
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
- Community 102
- Community 103
- Community 104
- getMailTransportAndFrom
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- ReportsCityHeatmapMap.tsx
- registry.ts
- Community 113
- loadMobilizeGroupCreatorPolicy
- certificate-requests.ts
- route.ts
- Community 117
- MobilizeBottomNavBar.tsx
- parse-upload.ts
- MissionBriefingPageContent.tsx
- Community 121
- page.tsx
- page.tsx
- Community 124
- Community 125
- Community 126
- Community 127
- parse-upload.ts
- Community 129
- page.tsx
- us-city-coordinates.ts
- route.ts
- PeopleOverviewClient.tsx
- route.ts
- GatheringDescriptionEditor.tsx
- dashboard-tour-steps.ts
- usStateByCode
- enrichMobilizeGroupsBrowse
- Community 139
- Community 140
- loadBroadcastTemplateEditorAccess
- Community 142
- dashboard-tour-storage.ts
- ReportsChartsClient.tsx
- Community 145
- overview-stats.ts
- FirstLoginPasswordGate.tsx
- Community 148
- page.tsx
- Community 150
- Community 151
- usStates.ts
- Community 153
- Community 154
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- Community 160
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- @dnd-kit/core
- @dnd-kit/sortable
- eslint-config-next
- eslint
- eslint-config-next
- @fortawesome/fontawesome-svg-core
- isomorphic-dompurify
- route.ts
- plyr
- react-easy-crop
- react-leaflet
- react-simple-maps
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
- Community 201
- Community 202
- Community 206
- Community 209
- Community 211
- @fortawesome/free-solid-svg-icons
- @fortawesome/react-fontawesome
- google-auth-library
- leaflet
- leaflet.markercluster
- @mui/icons-material
- @mui/material
- @mui/material-nextjs
- next
- next.config.ts
- nodemailer
- page.tsx
- react
- react-apexcharts
- react-dom
- react-dropzone
- stripe
- @supabase/ssr
- @supabase/supabase-js
- tinymce

## God Nodes (most connected - your core abstractions)
1. `createAdminClient()` - 296 edges
2. `requireApiAuth()` - 278 edges
3. `loadUserRoleNames()` - 267 edges
4. `can()` - 209 edges
5. `loadModulePermissions()` - 208 edges
6. `requireMobilizeRead()` - 181 edges
7. `isElevatedRole()` - 130 edges
8. `requireServerUser()` - 119 edges
9. `MODULE_SLUGS` - 114 edges
10. `createClient()` - 106 edges

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

## Communities (225 total, 84 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (36): POST(), POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST() (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (84): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+76 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (17): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (49): GET(), GET(), cards, MobilizeHomePage(), ChangePasswordDialog(), DashboardWelcome(), HeaderSuperAdminProfileAvatar(), capitalizeRole() (+41 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (22): GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx, GET() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (34): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), POST() (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (15): GET(), Ctx, GET(), primaryRoleLabel(), GET(), POST(), ADMIN_OWNER_ROLES, canCreateMobilizeGroup() (+7 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (32): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), MyGroupsPage(), AddMemberSearchableUser, MobilizeAddMemberDialog() (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (41): MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeFeedHtml(), Props, MobilizeHomeFeedClient() (+33 more)

### Community 12 - "Community 12"
Cohesion: 0.20
Nodes (21): ProgressPageContent(), progressRoleLabel(), listRoleNamesByUserIds(), graduateBadgeRoleFromRoles(), isUserCourseComplete(), loadCountableCourseSessionIds(), loadCourseSessionIds(), loadTrainingGraduateBadgesForUsers() (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.32
Nodes (15): isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES, MEMBER_NAV_MODULES, SUB_ADMIN_NAV_MODULES, canAccessPeopleLeaders() (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (29): RFC-5322, GET(), PATCH(), requireSuperAdmin(), GET(), GET(), getAppBaseUrl(), getGmailOAuthRedirectUri() (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (42): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+34 more)

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (10): ChapterOption, RegisterPage(), authFloatingTextFieldSx, SignInEmailChangePanel(), SignInEmailChangePanelProps, Mode, Props, PublicGroupJoinDialog() (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (15): compareRows(), CourseProgressSortKey, CourseProgressUsersTable(), initialsFromLabel(), pctForRow(), progressColor(), AvatarWithGraduateIcon(), BADGE_STYLES (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (25): GET(), JoinReq, MobilizeNotificationsPage(), MobilizeChapterUpdatesPanel(), Props, GroupUpdateNotification, MobilizeGroupCustomNotifications(), Props (+17 more)

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (27): ensureMobilizeGroupManager(), GET(), sanitizeIlikeTerm(), SearchableUser, searchDashboardUsersFromDb(), toSearchableBase(), chunkIdsForInQuery(), dashboardRowFromAuthUser() (+19 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (24): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+16 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (24): DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV (+16 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (33): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+25 more)

### Community 27 - "Community 27"
Cohesion: 0.07
Nodes (39): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+31 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (15): config, middleware(), POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (28): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+20 more)

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (9): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), BroadcastEmailTemplateEditorPage(), EditorMode, emptyForm(), formFromTemplate() (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.24
Nodes (15): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, blockTitleHtmlFromPlain(), blockTitlePlainFromHtml(), collectCourseBlockValidationIssues() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.24
Nodes (11): POST(), normalizeAuthEmail(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError(), asAuthErrorLike(), clearStaleAuthSession(), getAuthUser() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.10
Nodes (29): Cell, Body, POST(), POST(), ALLOWED_KEYS, PATCH(), ALLOWED, DEMO_SHORTCODES (+21 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (18): POST(), RouteCtx, rowToCampaign(), GET(), executeBroadcastCampaign(), SendCampaignResult, AvailableProviders, envSet() (+10 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (14): ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience(), normalizeBroadcastAudience(), normalizeOptionalScopeId(), resolveBroadcastRecipients(), STAFF_ROLES (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (24): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+16 more)

### Community 40 - "Community 40"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.35
Nodes (13): GET(), PUT(), cleanOptionalToken(), isSafeFeedAdHref(), isSafeFeedAdImageUrl(), loadMobilizeFeedAds(), parseBlockTitle(), parseCarouselBlock() (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.08
Nodes (48): POST(), GET(), DELETE(), GET(), PATCH(), RouteCtx, InviteBody, POST() (+40 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (10): AdBlockThumbnail(), blockLabel(), blockPreviewImageUrl(), MobilizeFeedAdsSettingsForm(), MobilizeFeedAdBlock, MobilizeFeedAdCarouselBlock, MobilizeFeedAdCarouselSlide, MobilizeFeedAdImageBlock (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (8): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (19): parseBackHref(), parseTab(), PersonProfilePageContent(), formatAddress(), formatBirthday(), formatGender(), formatRole(), formatState() (+11 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (50): DELETE(), isCommunicationsAdmin(), PATCH(), DELETE(), PATCH(), GET(), isCommunicationsAdmin(), POST() (+42 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.19
Nodes (15): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+7 more)

### Community 51 - "Community 51"
Cohesion: 0.15
Nodes (23): GET(), PATCH(), GET(), GET(), GET(), GET(), GET(), POST() (+15 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (15): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+7 more)

### Community 53 - "Community 53"
Cohesion: 0.16
Nodes (22): canManageGroupMembers(), Ctx, DELETE(), PATCH(), buildCommentTree(), CommentNode, CommentRow, Ctx (+14 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.24
Nodes (9): Ctx, POST(), Props, PublicMobilizeGroupPage(), applyMobilizeAutoCloseInactive(), enrollmentAcceptsNewMembers(), enrollmentAutoApproves(), JoinGroupMembershipResult (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (18): backup_env_files(), ensure_git_safe_directory(), ensure_repo_owned_by_deploy_owner(), free_listen_port(), kill_next_on_port(), kill_pids_on_port(), maybe_sudo(), PORT (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (4): child, { execSync, spawn }, path, port

### Community 58 - "Community 58"
Cohesion: 0.30
Nodes (11): GET(), GET(), POST(), buildConversationSummaries(), canSendDirectMessage(), loadDirectMessageThread(), loadMobilizeDirectMessages(), loadMutualFollowRecipients() (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.21
Nodes (12): Body, POST(), POST(), GET(), GET(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity() (+4 more)

### Community 60 - "Community 60"
Cohesion: 0.08
Nodes (32): CHAPTERS_ICONS, MobilizeBottomNav(), MobilizeChaptersBottomNav(), MobilizeSocialBottomNav(), Props, SOCIAL_ICONS, MobilizeBottomNavBar(), MobilizeBottomNavBarItem (+24 more)

### Community 61 - "Community 61"
Cohesion: 0.10
Nodes (22): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+14 more)

### Community 62 - "Community 62"
Cohesion: 0.23
Nodes (14): GET(), DashboardHomeContent(), DashboardHomePage(), includeReferenceInOverviewStatTotals(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit, sumReferenceTotals() (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.16
Nodes (17): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+9 more)

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (11): ReportsPresenceDateRangeControls(), Chart, chartOpts, formatDayLabel(), formatTrend(), rangeLabel(), ReportsPresenceSection(), StatCardProps (+3 more)

### Community 65 - "Community 65"
Cohesion: 0.19
Nodes (19): Chart, chartBase, ComparisonPayload, ReportsRegistrationComparison(), daysInclusive(), defaultWeekComparisonRanges(), endOfUtcDay(), endOfUtcDayFromYmd() (+11 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.14
Nodes (25): GET(), loadAutoCloseDays(), loadViewerSettings(), PUT(), requireSuperAdmin(), resolveViewerUserOptions(), MobilizeLayout(), MobilizeMemberProfilePage() (+17 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.18
Nodes (16): POST(), correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect() (+8 more)

### Community 76 - "Community 76"
Cohesion: 0.36
Nodes (11): displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle(), resolveCourseFinishedDisplay() (+3 more)

### Community 82 - "Community 82"
Cohesion: 0.24
Nodes (9): hexToRgb(), phaseHoverShadow(), MISSION_DIFFICULTY_COLORS, MISSION_DIFFICULTY_LABELS, MISSION_PHASES, MissionCard, MissionDifficulty, MissionPhase (+1 more)

### Community 84 - "Community 84"
Cohesion: 0.11
Nodes (25): ActivityFeedRow, CommunityInActionFeed(), ChapterRow, drawerLikeScrollbarSx, formatStatCompact(), NationalOverview(), UsaChapterActivityMap, isMemberOrLeader() (+17 more)

### Community 85 - "Community 85"
Cohesion: 0.37
Nodes (11): GET(), isBucket(), fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket, enumerateBucketLabels(), pad2() (+3 more)

### Community 86 - "Community 86"
Cohesion: 0.14
Nodes (16): MobilizeCollapsiblePostBody(), Props, COMMENT_EMOJI_OPTIONS, CommentComposer(), CommentContent(), CommentItem(), countComments(), MobilizeSocialComments() (+8 more)

### Community 87 - "Community 87"
Cohesion: 0.16
Nodes (18): ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, listOnboardingMemberUserIds(), loadCoachMeetingStatusIndex(), loadCountableSessionIdsCached() (+10 more)

### Community 88 - "Community 88"
Cohesion: 0.03
Nodes (99): capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow, Membership, MessageRow (+91 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 90 - "Community 90"
Cohesion: 0.36
Nodes (7): DEFAULT_TARGET_EMAILS, __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveUserId(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.07
Nodes (69): PATCH(), DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET(), PATCH() (+61 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (6): PATCH(), PatchBody, STATUSES, PatchBody, STATUSES, addMinutesIso()

### Community 94 - "Community 94"
Cohesion: 0.31
Nodes (8): EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage(), BroadcastSmsTemplateEditorPage(), emptyForm(), FormState, loadBroadcastTemplateEditorAccess()

### Community 95 - "Community 95"
Cohesion: 0.24
Nodes (7): JourneyWelcomeDialog(), Props, RICH_CONTENT_SX, BriefingVideoAdmin(), BRIEFING_WELCOME, MissionBriefingLanding(), Props

### Community 96 - "Community 96"
Cohesion: 0.07
Nodes (55): Ctx, isApprovedMember(), POST(), GET(), Ctx, GET(), Ctx, GET() (+47 more)

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (13): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), getZonedParts(), isThursdayNoonInTimeZone(), isWeeklyMembersPostWindow(), lastAutoFeedAt() (+5 more)

### Community 98 - "Community 98"
Cohesion: 0.17
Nodes (19): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), MaintenancePage(), metadata, ArmyAuthShell() (+11 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.13
Nodes (18): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+10 more)

### Community 100 - "page.tsx"
Cohesion: 0.11
Nodes (30): Ctx, GET(), isApprovedMember(), POST(), GET(), Ctx, DELETE(), PATCH() (+22 more)

### Community 102 - "Community 102"
Cohesion: 0.06
Nodes (50): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+42 more)

### Community 103 - "Community 103"
Cohesion: 0.32
Nodes (10): Ctx, POST(), getMobilizeResourcesPostAccess(), MobilizeResourcesPostAccess, ALLOWED_MIME, detectResourceDocumentExt(), extFromName(), isPdf() (+2 more)

### Community 104 - "Community 104"
Cohesion: 0.12
Nodes (37): GET(), isIsoDate(), POST(), PostBody, listProfilesByIds(), ChapterSearchRow, chaptersForStateFilter(), chapterStateFromProfile() (+29 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.06
Nodes (47): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+39 more)

### Community 106 - "Community 106"
Cohesion: 0.33
Nodes (7): barColorForPercent(), COLORS, geographyToStateCode(), HEAT_STOPS, heatFill(), ReportsStateDemographicMap(), RsmGeo

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 108 - "Community 108"
Cohesion: 0.09
Nodes (26): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+18 more)

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 110 - "Community 110"
Cohesion: 0.20
Nodes (14): chunkIds(), NotificationMenu(), NotificationRow, MobilizeNavNotificationsBadge(), EMPTY, notificationKeys(), useMobilizeNotifications(), formatNotificationDisplay() (+6 more)

### Community 111 - "ReportsCityHeatmapMap.tsx"
Cohesion: 0.24
Nodes (11): MissionRankInfoDialog(), Props, LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience, missionRankDialogTitle(), MissionRankProgress, missionRanksForAudience() (+3 more)

### Community 112 - "registry.ts"
Cohesion: 0.26
Nodes (17): GET(), POST(), GET(), POST(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic(), isMemberOnboardingAudience() (+9 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.13
Nodes (18): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringForm(), GatheringStatus, SupabaseStaleSessionCleanup(), countPresenceUsers() (+10 more)

### Community 115 - "certificate-requests.ts"
Cohesion: 0.14
Nodes (21): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), PatchBody (+13 more)

### Community 116 - "route.ts"
Cohesion: 0.17
Nodes (6): AdminRolesPage(), BroadcastHistoryPage(), CommunityPage(), EditCoursePage(), LeadersPage(), DataPaneFallback()

### Community 117 - "Community 117"
Cohesion: 0.29
Nodes (6): InviteFriendsBanner(), Slide, SLIDES, CourseIntroVideoBlock(), Props, ExternalTrainingCertificateBanner()

### Community 118 - "MobilizeBottomNavBar.tsx"
Cohesion: 0.22
Nodes (14): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), CoachMeetingBookingRecord (+6 more)

### Community 119 - "parse-upload.ts"
Cohesion: 0.17
Nodes (11): Editor, EmailTemplateRichEditor(), INSERT_SHORTCODES, TinyEditor, coerceQuizPayload(), CourseQuizFormEditor(), newQuestion(), normalizeQuestion() (+3 more)

### Community 120 - "MissionBriefingPageContent.tsx"
Cohesion: 0.33
Nodes (9): MissionCardItem(), CUSTOM_PARTNER_LOGO_SIZES, MISSION_PARTNER_LOGOS, missionPartnerLogoCustomSize(), MissionPartnerLogoSize, missionPartnerLogoUrl(), missionPartnerLogoUsesTallSize(), partnerLogoHost() (+1 more)

### Community 121 - "Community 121"
Cohesion: 0.52
Nodes (5): getAudioContext(), playBugleNote(), playMissionUpdateSound(), playMissionUpdateSoundAlert(), playSoundRepeated()

### Community 123 - "page.tsx"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 124 - "Community 124"
Cohesion: 0.70
Nodes (4): GET(), parseFilter(), parseJourneyProgressSortAscending(), parseJourneyProgressSortKey()

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "parse-upload.ts"
Cohesion: 0.24
Nodes (12): GET(), GET(), GroupRow, DuRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), MobilizeGroupBrowseExtras (+4 more)

### Community 129 - "Community 129"
Cohesion: 0.21
Nodes (16): DashboardLayout(), CommandCenterBackdrop(), DashboardUserProvider(), PermissionsContext, PermissionsProvider(), loadDashboardUser(), loadTrainingGraduateBadge(), ensureMemberRoleIfUserHasNoRoles() (+8 more)

### Community 130 - "page.tsx"
Cohesion: 0.28
Nodes (8): AnnouncementsNavBadge(), MissionUpdatesNavIcon(), MissionUpdatesUnreadContext, MissionUpdatesUnreadContextValue, MissionUpdatesUnreadProvider(), useMissionUpdatesUnread(), NotificationsDrawerUnreadCount(), getMissionUpdateSoundEnabled()

### Community 131 - "us-city-coordinates.ts"
Cohesion: 0.30
Nodes (8): areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), markAutoTourCompleted(), markTourStepIdsSeen(), markTourStepSeen(), readRaw(), storageKey()

### Community 133 - "PeopleOverviewClient.tsx"
Cohesion: 0.29
Nodes (11): countInviteShareMetrics(), countMobilizeChapterGroups(), countStartedMissions(), countUpcomingGatherings(), loadOverviewStats(), loadStatePopupStats(), normalizeStateCode(), OverviewScope (+3 more)

### Community 136 - "dashboard-tour-steps.ts"
Cohesion: 0.25
Nodes (13): DashboardTourActions, prepareSidebarTarget(), scrollTourTargetIntoView(), tourAttr(), buildMainDashboardTourEntries(), highlightHook(), MODULE_COPY, moduleCopyForProfile() (+5 more)

### Community 137 - "usStateByCode"
Cohesion: 0.16
Nodes (17): EventRow(), formatEventShort(), PublicGroupEvent, PublicGroupProfileData, PublicGroupProfileView(), US_STATE_FLAG_URL_BY_FIPS, US_STATES, usStateByCode() (+9 more)

### Community 138 - "enrichMobilizeGroupsBrowse"
Cohesion: 0.18
Nodes (13): MobilizeChapterFeedBanner(), Props, ChapterStateBadge(), chapterStateInitials(), leaderPillSx, MobilizeGroupsBrowseTable(), Props, SubgroupAvatars() (+5 more)

### Community 139 - "Community 139"
Cohesion: 0.36
Nodes (5): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo

### Community 140 - "Community 140"
Cohesion: 0.07
Nodes (43): formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer(), ImageCropDialog(), ImageCropKind (+35 more)

### Community 141 - "loadBroadcastTemplateEditorAccess"
Cohesion: 0.48
Nodes (6): CITY_COORDS, cityLookupKey(), hashString(), jitterAroundCentroid(), resolveCityCoordinates(), STATE_CENTROIDS

### Community 143 - "dashboard-tour-storage.ts"
Cohesion: 0.12
Nodes (24): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+16 more)

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 146 - "overview-stats.ts"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 148 - "Community 148"
Cohesion: 0.11
Nodes (52): AK, lat, lng, AL, AR, AZ, CA, CO (+44 more)

### Community 149 - "page.tsx"
Cohesion: 0.22
Nodes (7): ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption, ConversationSummary, DirectMessageRow, MESSAGES_EMPTY

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "usStates.ts"
Cohesion: 0.17
Nodes (5): ChaptersPage(), BroadcastTemplatesPage(), CourseProgressPage(), NewGatheringPage(), LogsPage()

### Community 155 - "page.tsx"
Cohesion: 0.33
Nodes (3): ChapterMapInviteCta(), SharePlatform, SOCIAL_BUTTONS

### Community 156 - "page.tsx"
Cohesion: 0.40
Nodes (4): NESTED_NAV_TOUCH_SX, Props, SidebarNestedNavItem, SidebarNestedNavList()

### Community 157 - "page.tsx"
Cohesion: 0.17
Nodes (11): LocationRow, LocationSortKey, LocationsSection(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY, ManualLogForm(), AuditRow, formatAuditDetails() (+3 more)

### Community 159 - "page.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 160 - "Community 160"
Cohesion: 0.29
Nodes (10): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, InviteShareChannel, inviteShareChannelLabel() (+2 more)

### Community 174 - "page.tsx"
Cohesion: 0.40
Nodes (5): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), PeopleOverviewStats

### Community 184 - "route.ts"
Cohesion: 0.08
Nodes (42): Ctx, GET(), normalizeStateCode(), POST(), GET(), upsertApprovedGroupMember(), Ctx, DELETE() (+34 more)

## Knowledge Gaps
- **724 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+719 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `Community 43` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 129`, `Community 8`, `Community 12`, `Community 15`, `Community 16`, `Community 23`, `Community 35`, `Community 36`, `Community 46`, `Community 47`, `Community 51`, `Community 55`, `Community 59`, `Community 62`, `Community 85`, `Community 91`, `Community 93`, `Community 97`, `Community 102`, `Community 104`, `getMailTransportAndFrom`, `certificate-requests.ts`, `page.tsx`, `Community 124`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Community 31` to `Community 9`, `Community 43`, `Community 39`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 13`, `Community 142`, `overview-stats.ts`, `Community 153`, `Community 154`, `Community 31`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@fortawesome/fontawesome-svg-core`, `isomorphic-dompurify`, `plyr`, `react-easy-crop`, `react-leaflet`, `react-simple-maps`, `@tinymce/tinymce-react`, `Community 201`, `Community 202`, `Community 206`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `@mui/material-nextjs`, `next`, `nodemailer`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _724 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10790960451977401 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08772893772893772 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.052429667519181586 - nodes in this community are weakly interconnected._