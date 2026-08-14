# Graph Report - dashboard  (2026-08-14)

## Corpus Check
- 835 files · ~407,017 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3786 nodes · 12723 edges · 226 communities (142 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c6e478a`
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
- journey-feed.ts
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
- InviteFriendsBanner.tsx
- Community 142
- dashboard-tour-storage.ts
- ReportsChartsClient.tsx
- Community 145
- overview-stats.ts
- FirstLoginPasswordGate.tsx
- Community 148
- registry.ts
- Community 150
- Community 151
- usStates.ts
- Community 153
- Community 154
- route.ts
- MobilizeSocialSettingsClient.tsx
- page.tsx
- page.tsx
- page.tsx
- route.ts
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- send.ts
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
- dashboard-tour-actions.ts
- SidebarNestedNavList.tsx
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
3. `loadUserRoleNames()` - 269 edges
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

## Communities (226 total, 84 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (41): PATCH(), GET(), isCommunicationsAdmin(), POST(), GET(), isCommunicationsAdmin(), POST(), AnnouncementsNavBadge() (+33 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (30): POST(), POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST() (+22 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (84): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+76 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (24): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo, ReportsPresenceDateRangeControls(), Chart, chartOpts (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (30): GET(), ChangePasswordDialog(), HeaderSuperAdminProfileAvatar(), capitalizeRole(), GroupMemberPreviewRow, MobilizeGroupMembersPreview(), Props, MobilizeCollapsiblePostBody() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (38): POST(), GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (26): GET(), loadExcludedAdminUserIds(), POST(), PostBody, POST(), POST(), POST(), POST() (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (44): DELETE(), DELETE(), formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST() (+36 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (31): AddMemberSearchableUser, MobilizeAddMemberDialog(), parseCommaSeparatedEmails(), primaryRoleLabel(), userInitials(), formatDate(), logColor(), MobilizeAutoFollowAddDialog() (+23 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (42): DashboardWelcome(), MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeGroupFeed(), Props, toUnifiedPost() (+34 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (23): AutoFollowTarget, AutoFollowTargetUser, GET(), POST(), chunkIdsForInQuery(), dashboardRowFromAuthUser(), DashboardUserListRow, listAllDashboardUsers() (+15 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.28
Nodes (15): isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES, MEMBER_NAV_MODULES, SUB_ADMIN_NAV_MODULES, canAccessPeopleLeaders() (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (29): RFC-5322, GET(), PATCH(), requireSuperAdmin(), GET(), GET(), getAppBaseUrl(), getGmailOAuthRedirectUri() (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (42): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+34 more)

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (16): ChapterOption, RegisterPage(), authFloatingTextFieldSx, SignInEmailChangePanel(), SignInEmailChangePanelProps, Mode, Props, PublicGroupJoinDialog() (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.14
Nodes (34): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+26 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (12): ActiveGroupPayload, GROUP_NAME_ACTIVE_SX, MOBILIZE_DASHBOARD_NAV_ITEM_SX, MobilizeSidebarNav(), MyGroupRow, NAV_ITEM_TOUCH_SX, NAV_SELECTED_SX, Props (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (22): GET(), MobilizeChapterUpdatesPanel(), Props, MobilizeGroupCustomNotifications(), EventNotificationCard(), JoinRequestCard(), MobilizeNotificationsClient(), notificationCardSx() (+14 more)

### Community 22 - "Community 22"
Cohesion: 0.43
Nodes (7): ensureMobilizeGroupManager(), GET(), sanitizeIlikeTerm(), SearchableUser, searchDashboardUsersFromDb(), toSearchableBase(), listDashboardUsersByIds()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

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
Cohesion: 0.19
Nodes (14): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (15): config, middleware(), POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (23): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+15 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (21): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+13 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (22): MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, Props, Props (+14 more)

### Community 33 - "Community 33"
Cohesion: 0.27
Nodes (10): POST(), writeAuditLog(), normalizeAuthEmail(), signInPasswordCandidates(), asAuthErrorLike(), clearStaleAuthSession(), getAuthUser(), getSupabaseSession() (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.08
Nodes (44): Body, POST(), POST(), Cell, PATCH(), Body, POST(), GET() (+36 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (24): GET(), executeBroadcastCampaign(), SendCampaignResult, AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders() (+16 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (13): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker, AnnouncementDescriptionBody(), darkHtmlSx (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.10
Nodes (28): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+20 more)

### Community 40 - "Community 40"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (23): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+15 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.10
Nodes (30): GET(), POST(), stripHtml(), GET(), isCommunicationsAdmin(), displayNameForUser(), POST(), POST() (+22 more)

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (16): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), displayNameFromUser() (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.16
Nodes (20): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+12 more)

### Community 46 - "Community 46"
Cohesion: 0.09
Nodes (20): MobilizeFeedAdImageDropzone(), Props, feedAdImageSx, MobilizeFeedAdsCarousel(), Props, SlideMedia(), AdImageBlock(), MobilizeFeedAdsRail() (+12 more)

### Community 47 - "Community 47"
Cohesion: 0.13
Nodes (17): formatAddress(), formatBirthday(), formatGender(), formatRole(), formatState(), NAV, panelSx, PersonProfileClient() (+9 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.16
Nodes (16): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+8 more)

### Community 51 - "Community 51"
Cohesion: 0.12
Nodes (28): POST(), GET(), PATCH(), GET(), GET(), GET(), GET(), GET() (+20 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (16): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+8 more)

### Community 53 - "Community 53"
Cohesion: 0.16
Nodes (22): canManageGroupMembers(), Ctx, DELETE(), PATCH(), buildCommentTree(), CommentNode, CommentRow, Ctx (+14 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): Props, PublicMobilizeGroupPage(), EventRow(), formatEventShort(), PublicGroupEvent, PublicGroupProfileData, PublicGroupProfileView(), applyMobilizeAutoCloseInactive()

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (18): backup_env_files(), ensure_git_safe_directory(), ensure_repo_owned_by_deploy_owner(), free_listen_port(), kill_next_on_port(), kill_pids_on_port(), maybe_sudo(), PORT (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (4): child, { execSync, spawn }, path, port

### Community 58 - "Community 58"
Cohesion: 0.15
Nodes (17): GET(), GET(), POST(), ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption, buildConversationSummaries() (+9 more)

### Community 59 - "Community 59"
Cohesion: 0.20
Nodes (14): DashboardLayout(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsContext, PermissionsProvider(), useCan(), usePermissions() (+6 more)

### Community 60 - "Community 60"
Cohesion: 0.09
Nodes (29): cards, MobilizeHomePage(), CHAPTERS_ICONS, MobilizeBottomNav(), MobilizeChaptersBottomNav(), MobilizeSocialBottomNav(), Props, SOCIAL_ICONS (+21 more)

### Community 61 - "Community 61"
Cohesion: 0.09
Nodes (31): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+23 more)

### Community 62 - "Community 62"
Cohesion: 0.18
Nodes (14): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit, AGE_BUCKETS (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.12
Nodes (24): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+16 more)

### Community 64 - "Community 64"
Cohesion: 0.17
Nodes (18): GET(), Ctx, GET(), primaryRoleLabel(), GET(), POST(), listAdminDashboardUserIds(), listUserIdsByRoleNames() (+10 more)

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (21): countUsersRegistered(), GET(), Chart, chartBase, ComparisonPayload, ReportsRegistrationComparison(), daysInclusive(), defaultWeekComparisonRanges() (+13 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.17
Nodes (22): GET(), loadAutoCloseDays(), loadViewerSettings(), PUT(), requireSuperAdmin(), resolveViewerUserOptions(), MobilizeLayout(), MobilizeMemberProfilePage() (+14 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.06
Nodes (50): POST(), ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, coerceQuizPayload(), CourseQuizFormEditor() (+42 more)

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (16): ActivityFeedRow, CommunityInActionFeed(), displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime() (+8 more)

### Community 82 - "Community 82"
Cohesion: 0.20
Nodes (15): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, InviteShareChannel, inviteShareChannelLabel() (+7 more)

### Community 84 - "Community 84"
Cohesion: 0.36
Nodes (8): COMMUNITY_CATS, COMMUNITY_FEED_TIER_LABELS, CommunityFeedTier, IMPACT_CATS, LEADER_CATS, MILESTONE_CATS, resolveCommunityFeedTier(), SOCIAL_CATS

### Community 85 - "Community 85"
Cohesion: 0.29
Nodes (13): GET(), isBucket(), CourseQuizResultRow, CourseSessionProgressRow, fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket (+5 more)

### Community 86 - "Community 86"
Cohesion: 0.26
Nodes (13): Ctx, GET(), isApprovedMember(), POST(), GET(), isValidAnnouncementImagePath(), isValidProfilePostImagePath(), isValidSocialPostImagePath() (+5 more)

### Community 87 - "Community 87"
Cohesion: 0.14
Nodes (21): loadCountableCourseSessionIds(), ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, listOnboardingMemberUserIds(), loadCoachMeetingStatusIndex() (+13 more)

### Community 88 - "Community 88"
Cohesion: 0.03
Nodes (86): capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow, Membership, MessageRow (+78 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 90 - "Community 90"
Cohesion: 0.36
Nodes (7): DEFAULT_TARGET_EMAILS, __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveUserId(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.07
Nodes (50): POST(), POST(), POST(), GET(), GET(), Body, PATCH(), POST() (+42 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.22
Nodes (14): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), CoachMeetingBookingRecord (+6 more)

### Community 94 - "Community 94"
Cohesion: 0.12
Nodes (23): Body, POST(), Body, POST(), GET(), PATCH(), PatchBody, GET() (+15 more)

### Community 95 - "Community 95"
Cohesion: 0.18
Nodes (10): JourneyWelcomeDialog(), Props, RICH_CONTENT_SX, BriefingVideoAdmin(), BRIEFING_WELCOME, MissionBriefingLanding(), Props, MissionBriefingPlayer() (+2 more)

### Community 96 - "Community 96"
Cohesion: 0.06
Nodes (60): Ctx, isApprovedMember(), POST(), Ctx, loadMembership(), POST(), DELETE(), GET() (+52 more)

### Community 97 - "Community 97"
Cohesion: 0.14
Nodes (23): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), getZonedParts(), isThursdayNoonInTimeZone(), isWeeklyMembersPostWindow(), lastAutoFeedAt() (+15 more)

### Community 98 - "Community 98"
Cohesion: 0.17
Nodes (19): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), MaintenancePage(), metadata, ArmyAuthShell() (+11 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.12
Nodes (26): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+18 more)

### Community 100 - "page.tsx"
Cohesion: 0.18
Nodes (16): Ctx, DELETE(), PATCH(), Ctx, GET(), loadMembership(), POST(), Ctx (+8 more)

### Community 101 - "journey-feed.ts"
Cohesion: 0.24
Nodes (8): GET(), GET(), Ctx, POST(), attachGroupNames(), fetchMobilizeEventsInRange(), MobilizeCalendarEventRow, MobilizeAuthOk

### Community 102 - "Community 102"
Cohesion: 0.09
Nodes (21): CourseGridClient(), SESSION_CARD_TOUCH_SX, SessionCard(), SessionCardModel, TRAINING_LESSONS_PANEL_SX, accept, GatheringImageFields(), uploadToGatheringsBucket() (+13 more)

### Community 103 - "Community 103"
Cohesion: 0.21
Nodes (16): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+8 more)

### Community 104 - "Community 104"
Cohesion: 0.18
Nodes (24): GET(), isIsoDate(), POST(), PostBody, chaptersForStateFilter(), chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed() (+16 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.09
Nodes (30): Ctx, DELETE(), GET(), PATCH(), GET(), Ctx, GET(), isApprovedMember() (+22 more)

### Community 106 - "Community 106"
Cohesion: 0.26
Nodes (11): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventPage(), EventCategoryPill(), EventDescriptionHtml(), Props, EventImageCarousel() (+3 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 108 - "Community 108"
Cohesion: 0.16
Nodes (16): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+8 more)

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 110 - "Community 110"
Cohesion: 0.24
Nodes (13): chunkIds(), NotificationMenu(), NotificationRow, MobilizeNavNotificationsBadge(), EMPTY, notificationKeys(), useMobilizeNotifications(), formatNotificationDisplay() (+5 more)

### Community 111 - "ReportsCityHeatmapMap.tsx"
Cohesion: 0.33
Nodes (14): GET(), PUT(), cleanOptionalToken(), isSafeFeedAdHref(), isSafeFeedAdImageUrl(), loadMobilizeFeedAds(), normalizeCarouselSpeedMs(), parseBlockTitle() (+6 more)

### Community 112 - "registry.ts"
Cohesion: 0.35
Nodes (13): GET(), POST(), GET(), POST(), coachMeetingKindForAudience(), coachMeetingTopic(), isMemberOnboardingAudience(), loadCoachMeetingForUser() (+5 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.36
Nodes (6): FirstLoginPasswordGate(), isInvalidLoginCredentialsError(), formatAuthSignInError(), isStaleRefreshTokenError(), asAuthErrorLike(), getClientAuthUser()

### Community 115 - "certificate-requests.ts"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 116 - "route.ts"
Cohesion: 0.17
Nodes (5): AdminRolesPage(), CourseProgressPage(), GatheringsPage(), LeadersPage(), LogsPage()

### Community 117 - "Community 117"
Cohesion: 0.29
Nodes (6): assignmentSteps, checklist, IntroVideoAdminProps, Props, TrainingCommandLanding(), TrainingIntroVideoAdmin()

### Community 118 - "MobilizeBottomNavBar.tsx"
Cohesion: 0.24
Nodes (9): hexToRgb(), phaseHoverShadow(), MISSION_DIFFICULTY_COLORS, MISSION_DIFFICULTY_LABELS, MISSION_PHASES, MissionCard, MissionDifficulty, MissionPhase (+1 more)

### Community 119 - "parse-upload.ts"
Cohesion: 0.17
Nodes (11): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS (+3 more)

### Community 120 - "MissionBriefingPageContent.tsx"
Cohesion: 0.52
Nodes (6): normalizeKeys(), ParsedUpload, parseUploadFile(), pickBestSheetRows(), rowsFromSheet(), stringifyCell()

### Community 121 - "Community 121"
Cohesion: 0.42
Nodes (6): playCommunityActionSoundAlert(), getAudioContext(), playBugleNote(), playMissionUpdateSound(), playMissionUpdateSoundAlert(), playSoundRepeated()

### Community 123 - "page.tsx"
Cohesion: 0.33
Nodes (9): MissionCardItem(), CUSTOM_PARTNER_LOGO_SIZES, MISSION_PARTNER_LOGOS, missionPartnerLogoCustomSize(), MissionPartnerLogoSize, missionPartnerLogoUrl(), missionPartnerLogoUsesTallSize(), partnerLogoHost() (+1 more)

### Community 124 - "Community 124"
Cohesion: 0.14
Nodes (21): DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), RunMode, RunTourOptions (+13 more)

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "parse-upload.ts"
Cohesion: 0.24
Nodes (12): GET(), GET(), GroupRow, DuRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), MobilizeGroupBrowseExtras (+4 more)

### Community 129 - "Community 129"
Cohesion: 0.27
Nodes (8): MissionsPage(), MissionBriefingPageInner(), MissionBriefingPage(), MissionsLanding(), JourneyMilestones, loadJourneyMilestones(), loadMemberOnboardingSnapshot(), loadBriefingVideoUrl()

### Community 130 - "page.tsx"
Cohesion: 0.26
Nodes (13): preferNonEmptyAddr(), graduateBadgeRoleFromRoles(), isUserCourseComplete(), loadCourseSessionIds(), loadTrainingGraduateBadge(), loadTrainingGraduateBadgesForUsers(), userCompletedAllSessions(), UserRoleRow (+5 more)

### Community 131 - "us-city-coordinates.ts"
Cohesion: 0.17
Nodes (16): ChapterRow, drawerLikeScrollbarSx, formatStatCompact(), NationalOverview(), UsaChapterActivityMap, isMemberOrLeader(), CommunityActivityFeedRow, HIDDEN_COMMUNITY_FEED_CATEGORIES (+8 more)

### Community 133 - "PeopleOverviewClient.tsx"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 135 - "GatheringDescriptionEditor.tsx"
Cohesion: 0.40
Nodes (6): formatEventDateTime(), PublicEventsPage(), EventListItem, EventsListClient(), formatEventDateTime(), formatEventLocationLine()

### Community 136 - "dashboard-tour-steps.ts"
Cohesion: 0.27
Nodes (8): FOLLOW_BTN_SX, formatRelativeTime(), MobilizeSocialAuthor, MobilizeSocialPostHeader(), Props, formatVerifiedSince(), Props, VerifiedUserBadge()

### Community 137 - "usStateByCode"
Cohesion: 0.28
Nodes (7): LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY, ManualLogForm(), AuditRow, formatAuditDetails(), LogSortKey, LogsTable()

### Community 138 - "enrichMobilizeGroupsBrowse"
Cohesion: 0.09
Nodes (35): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), MyGroupsPage(), JoinReq, MobilizeNotificationsPage() (+27 more)

### Community 140 - "Community 140"
Cohesion: 0.06
Nodes (49): MissionRankInfoDialog(), Props, formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer() (+41 more)

### Community 141 - "InviteFriendsBanner.tsx"
Cohesion: 0.29
Nodes (6): ALL_SLIDES, InviteFriendsBanner(), Slide, SLIDES, CourseIntroVideoBlock(), Props

### Community 143 - "dashboard-tour-storage.ts"
Cohesion: 0.22
Nodes (11): createDriverInstance(), noopOverlayClick(), areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), hasAutoTourCompleted(), markAutoTourCompleted(), markTourStepIdsSeen() (+3 more)

### Community 144 - "ReportsChartsClient.tsx"
Cohesion: 0.53
Nodes (5): SessionPageContent(), ProgressPageContent(), progressRoleLabel(), fetchCourseQuizResultsForElements(), isQuizOnlySession()

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 146 - "overview-stats.ts"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 147 - "FirstLoginPasswordGate.tsx"
Cohesion: 0.40
Nodes (5): MobilizeGroupShareDialog(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS

### Community 148 - "Community 148"
Cohesion: 0.11
Nodes (52): AK, lat, lng, AL, AR, AZ, CA, CO (+44 more)

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "usStates.ts"
Cohesion: 0.17
Nodes (6): ChaptersPage(), EditGatheringPage(), ChapertsPage(), FirstMissionsPage(), TrainingPage(), DataPaneFallback()

### Community 157 - "page.tsx"
Cohesion: 0.29
Nodes (7): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), useSyncedState()

### Community 159 - "page.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 184 - "route.ts"
Cohesion: 0.09
Nodes (36): Ctx, DELETE(), PATCH(), canManageEvents(), Ctx, GET(), isApprovedMember(), POST() (+28 more)

### Community 203 - "dashboard-tour-actions.ts"
Cohesion: 0.25
Nodes (13): DashboardTourActions, prepareSidebarTarget(), scrollTourTargetIntoView(), tourAttr(), buildMainDashboardTourEntries(), highlightHook(), MODULE_COPY, moduleCopyForProfile() (+5 more)

### Community 204 - "SidebarNestedNavList.tsx"
Cohesion: 0.40
Nodes (4): NESTED_NAV_TOUCH_SX, Props, SidebarNestedNavItem, SidebarNestedNavList()

## Knowledge Gaps
- **731 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+726 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `Community 43` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `GatheringDescriptionEditor.tsx`, `Community 15`, `Community 16`, `ReportsChartsClient.tsx`, `Community 23`, `Community 35`, `Community 41`, `Community 44`, `Community 51`, `Community 55`, `route.ts`, `Community 59`, `Community 65`, `Community 85`, `Community 91`, `Community 94`, `Community 97`, `journey-feed.ts`, `Community 104`, `getMailTransportAndFrom`, `Community 106`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Community 31` to `MissionBriefingPageContent.tsx`, `Community 9`, `Community 43`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 13`, `Community 142`, `overview-stats.ts`, `Community 153`, `Community 154`, `Community 31`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@fortawesome/fontawesome-svg-core`, `isomorphic-dompurify`, `plyr`, `react-easy-crop`, `react-leaflet`, `react-simple-maps`, `@tinymce/tinymce-react`, `Community 201`, `Community 202`, `Community 206`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `@mui/material-nextjs`, `next`, `nodemailer`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _731 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08834586466165413 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08772893772893772 - nodes in this community are weakly interconnected._