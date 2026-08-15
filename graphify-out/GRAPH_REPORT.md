# Graph Report - dashboard  (2026-08-14)

## Corpus Check
- 845 files · ~413,286 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3834 nodes · 12849 edges · 209 communities (143 shown, 66 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2331360a`
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
- page.tsx
- ReportsChartsClient.tsx
- Community 145
- overview-stats.ts
- page.tsx
- Community 148
- registry.ts
- Community 150
- Community 151
- usStates.ts
- Community 153
- Community 154
- page.tsx
- MobilizeSocialSettingsClient.tsx
- page.tsx
- page.tsx
- page.tsx
- route.ts
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
- eslint-config-next
- eslint
- route.ts
- react-easy-crop
- react-leaflet
- EmailTemplateRichEditor.tsx
- @types/node
- MobilizeGroupShareDialog.tsx
- UserNotesAdminClient.tsx
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
- react
- react-apexcharts
- react-dom
- react-dropzone
- stripe
- @supabase/ssr
- @supabase/supabase-js
- tinymce

## God Nodes (most connected - your core abstractions)
1. `createAdminClient()` - 297 edges
2. `requireApiAuth()` - 279 edges
3. `loadUserRoleNames()` - 269 edges
4. `can()` - 209 edges
5. `loadModulePermissions()` - 208 edges
6. `requireMobilizeRead()` - 185 edges
7. `isElevatedRole()` - 130 edges
8. `requireServerUser()` - 119 edges
9. `MODULE_SLUGS` - 114 edges
10. `createClient()` - 104 edges

## Surprising Connections (you probably didn't know these)
- `middleware()` --calls--> `getSupabaseSession()`  [EXTRACTED]
  middleware.ts → src/utils/supabase/middleware.ts
- `middleware()` --calls--> `redirectExpiredAppSession()`  [EXTRACTED]
  middleware.ts → src/utils/supabase/middleware-session.ts
- `buildXlsxBuffer()` --references--> `xlsx`  [EXTRACTED]
  src/lib/export/xlsx-buffer.ts → package.json
- `parseUploadFile()` --references--> `xlsx`  [EXTRACTED]
  src/lib/import/parse-upload.ts → package.json
- `middleware()` --calls--> `isMaintenanceExemptPath()`  [EXTRACTED]
  middleware.ts → src/lib/maintenance.ts

## Import Cycles
- None detected.

## Communities (209 total, 66 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.31
Nodes (15): DELETE(), isCommunicationsAdmin(), PATCH(), DELETE(), PATCH(), GET(), isCommunicationsAdmin(), POST() (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (32): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (82): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+74 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (43): fetchPresenceRowsInRange(), GET(), PresenceRow, barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo (+35 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (12): MobilizeCollapsiblePostBody(), Props, COMMENT_EMOJI_OPTIONS, CommentComposer(), CommentContent(), CommentItem(), countComments(), MobilizeSocialComments() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (30): canManageEvents(), Ctx, GET(), isApprovedMember(), POST(), Ctx, DELETE(), loadMembership() (+22 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (22): AutoFollowTarget, AddMemberSearchableUser, MobilizeAddMemberDialog(), parseCommaSeparatedEmails(), primaryRoleLabel(), userInitials(), formatDate(), logColor() (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.31
Nodes (9): compareRows(), CourseProgressRow, CourseProgressSortKey, CourseProgressUsersTable(), initialsFromLabel(), pctForRow(), progressColor(), ProgressRoleBucket (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (52): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+44 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (43): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+35 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (35): DashboardWelcome(), MobilizeSectionEmptyState(), Props, MobilizeBookmarksClient(), MobilizeGroupFeed(), Props, toUnifiedPost(), MobilizeHomeFeedClient() (+27 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (39): GET(), GET(), POST(), GET(), loadAutoCloseDays(), loadViewerSettings(), PUT(), requireSuperAdmin() (+31 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (22): ChaptersGroupsNavGroup(), GROUP_NAME_ACTIVE_SX, MyGroupRow, NAV_ITEM_TOUCH_SX, NAV_SELECTED_SX, Props, MOBILIZE_GROUP_TAB_ICONS, MOBILIZE_GROUP_TAB_NAV_SX (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (34): RFC-5322, POST(), POST(), GET(), PATCH(), requireSuperAdmin(), GET(), GET() (+26 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (42): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+34 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (24): DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.30
Nodes (15): ProgressPageContent(), progressRoleLabel(), listDashboardUsersByIds(), listRoleNamesByUserIds(), preferNonEmptyAddr(), graduateBadgeRoleFromRoles(), computeCourseCompletionRow(), progressRoleBucketFromSlugs() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (23): GET(), JoinReq, MobilizeNotificationsPage(), MobilizeChapterUpdatesPanel(), Props, MobilizeGroupCustomNotifications(), EventNotificationCard(), JoinRequestCard() (+15 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (22): GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx, POST() (+14 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.05
Nodes (46): cards, MobilizeHomePage(), ChangePasswordDialog(), HeaderSuperAdminProfileAvatar(), AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog() (+38 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (32): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+24 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (22): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.10
Nodes (35): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), Body (+27 more)

### Community 29 - "Community 29"
Cohesion: 0.10
Nodes (23): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+15 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (17): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (16): GET(), parseRoleFilter(), GET(), GET(), GET(), CourseProgressExportRoleFilter, assertSuperAdminExportAccess(), buildUserDirectoryExportRows() (+8 more)

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (18): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), displayNameFromUser() (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+29 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (19): DELETE(), getSessionAndPermissions(), PATCH(), PatchBody, PATCH(), PatchBody, GET(), PATCH() (+11 more)

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (18): executeBroadcastCampaign(), SendCampaignResult, sendBroadcastEmail(), sendBroadcastSms(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional() (+10 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (23): Ctx, GET(), primaryRoleLabel(), ensureMobilizeGroupManager(), GET(), sanitizeIlikeTerm(), SearchableUser, searchDashboardUsersFromDb() (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (18): engines, node, name, private, scripts, build, clean, dev (+10 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (24): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+16 more)

### Community 40 - "Community 40"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.10
Nodes (32): GET(), GET(), GET(), GET(), POST(), parseBackHref(), parseTab(), PersonProfilePageContent() (+24 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.30
Nodes (15): GET(), PUT(), cleanOptionalToken(), isSafeFeedAdHref(), isSafeFeedAdImageUrl(), loadMobilizeFeedAds(), normalizeCarouselSpeedMs(), parseBlockTitle() (+7 more)

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (13): Ctx, DELETE(), loadGroupMemberAccess(), PATCH(), Ctx, GET(), normalizeStateCode(), POST() (+5 more)

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (16): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.14
Nodes (11): feedAdImageSx, MobilizeFeedAdsCarousel(), Props, SlideMedia(), AdImageBlock(), MobilizeFeedAdsRail(), Props, MobilizeFeedHtml() (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.12
Nodes (23): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+15 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 51 - "Community 51"
Cohesion: 0.19
Nodes (12): POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired(), readSessionStartedAt(), setSessionStartedCookie() (+4 more)

### Community 52 - "Community 52"
Cohesion: 0.16
Nodes (18): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+10 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (27): Ctx, POST(), Ctx, loadMembership(), POST(), Ctx, POST(), SHARE_CHANNELS (+19 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.06
Nodes (37): GET(), GET(), AlertAvatar(), formatAlertTime(), KIND_BADGE, UserNotificationsClient(), readLastSeen(), UserNotificationsMenu() (+29 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (18): backup_env_files(), ensure_git_safe_directory(), ensure_repo_owned_by_deploy_owner(), free_listen_port(), kill_next_on_port(), kill_pids_on_port(), maybe_sudo(), PORT (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (4): child, { execSync, spawn }, path, port

### Community 58 - "Community 58"
Cohesion: 0.14
Nodes (18): GET(), GET(), POST(), ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption, buildConversationSummaries() (+10 more)

### Community 59 - "Community 59"
Cohesion: 0.19
Nodes (17): POST(), MissionsPage(), MissionBriefingPageInner(), MissionBriefingPage(), MissionsLanding(), JourneyMilestones, loadJourneyMilestones(), createAdminCompletedJourneySnapshot() (+9 more)

### Community 60 - "Community 60"
Cohesion: 0.26
Nodes (11): DashboardLayout(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsContext, PermissionsProvider(), DashboardUser, loadDashboardUser() (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.26
Nodes (10): MissionRankInfoDialog(), Props, LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience, missionRankDialogTitle(), MissionRankProgress, missionRanksForAudience() (+2 more)

### Community 62 - "Community 62"
Cohesion: 0.23
Nodes (14): GET(), DashboardHomeContent(), DashboardHomePage(), includeReferenceInOverviewStatTotals(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit, sumReferenceTotals() (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.20
Nodes (14): chunkIds(), NotificationMenu(), NotificationRow, MobilizeNavNotificationsBadge(), EMPTY, notificationKeys(), useMobilizeNotifications(), formatNotificationDisplay() (+6 more)

### Community 64 - "Community 64"
Cohesion: 0.08
Nodes (54): POST(), GET(), POST(), rowToCampaign(), GET(), DELETE(), GET(), PATCH() (+46 more)

### Community 65 - "Community 65"
Cohesion: 0.09
Nodes (36): countUsersRegistered(), GET(), baseOpts, Chart, CourseCompletionComparison(), Props, baseOpts, Bucket (+28 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.10
Nodes (18): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS (+10 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.24
Nodes (15): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, blockTitleHtmlFromPlain(), blockTitlePlainFromHtml(), collectCourseBlockValidationIssues() (+7 more)

### Community 76 - "Community 76"
Cohesion: 0.28
Nodes (14): displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle(), resolveCourseFinishedDisplay() (+6 more)

### Community 82 - "Community 82"
Cohesion: 0.27
Nodes (9): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, InviteShareChannel, isInviteShareChannel() (+1 more)

### Community 84 - "Community 84"
Cohesion: 0.22
Nodes (15): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+7 more)

### Community 85 - "Community 85"
Cohesion: 0.42
Nodes (5): config, middleware(), isMaintenanceExemptPath(), isMaintenanceMode(), applyAppSessionPolicy()

### Community 86 - "Community 86"
Cohesion: 0.29
Nodes (13): GET(), isBucket(), CourseQuizResultRow, CourseSessionProgressRow, fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket (+5 more)

### Community 87 - "Community 87"
Cohesion: 0.15
Nodes (19): loadCountableCourseSessionIds(), ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, listOnboardingMemberUserIds(), loadCoachMeetingStatusIndex() (+11 more)

### Community 88 - "Community 88"
Cohesion: 0.04
Nodes (68): capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow, Membership, MessageRow (+60 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 90 - "Community 90"
Cohesion: 0.36
Nodes (7): DEFAULT_TARGET_EMAILS, __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveUserId(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.21
Nodes (18): CommunityPageContent(), PeoplePage(), PeoplePageContent(), isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES (+10 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.19
Nodes (14): announcementPlainTextPreview(), emptyCta(), fromLocalDatetimeValue(), NotificationsAppClient(), Snack, toLocalDatetimeValue(), ANNOUNCEMENT_AUDIENCES, AnnouncementAudience (+6 more)

### Community 94 - "Community 94"
Cohesion: 0.23
Nodes (13): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker, AnnouncementDescriptionBody(), darkHtmlSx (+5 more)

### Community 95 - "Community 95"
Cohesion: 0.11
Nodes (25): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+17 more)

### Community 96 - "Community 96"
Cohesion: 0.08
Nodes (49): Ctx, isApprovedMember(), POST(), GET(), Ctx, GET(), Ctx, GET() (+41 more)

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (13): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), getZonedParts(), isThursdayNoonInTimeZone(), isWeeklyMembersPostWindow(), lastAutoFeedAt() (+5 more)

### Community 98 - "Community 98"
Cohesion: 0.22
Nodes (11): ResetPasswordPage(), ForgotPasswordPage(), ChapterOption, RegisterPage(), MaintenancePage(), metadata, ArmyAuthShell(), authFloatingTextFieldSx (+3 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.13
Nodes (20): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+12 more)

### Community 100 - "page.tsx"
Cohesion: 0.11
Nodes (29): Ctx, GET(), isApprovedMember(), POST(), GET(), Ctx, DELETE(), PATCH() (+21 more)

### Community 101 - "journey-feed.ts"
Cohesion: 0.18
Nodes (10): JourneyWelcomeDialog(), Props, RICH_CONTENT_SX, BriefingVideoAdmin(), BRIEFING_WELCOME, MissionBriefingLanding(), Props, MissionBriefingPlayer() (+2 more)

### Community 102 - "Community 102"
Cohesion: 0.42
Nodes (6): GET(), AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders()

### Community 103 - "Community 103"
Cohesion: 0.18
Nodes (8): AdBlockThumbnail(), blockLabel(), blockPreviewImageUrl(), MobilizeFeedAdsSettingsForm(), MobilizeFeedAdCarouselBlock, MobilizeFeedAdImageBlock, MobilizeFeedAdLinkTarget, MobilizeFeedAdRichTextBlock

### Community 104 - "Community 104"
Cohesion: 0.07
Nodes (56): GET(), parseFilter(), Body, POST(), GET(), PATCH(), PatchBody, GET() (+48 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.07
Nodes (42): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+34 more)

### Community 106 - "Community 106"
Cohesion: 0.28
Nodes (8): AnnouncementsNavBadge(), MissionUpdatesNavIcon(), MissionUpdatesUnreadContext, MissionUpdatesUnreadContextValue, MissionUpdatesUnreadProvider(), useMissionUpdatesUnread(), NotificationsDrawerUnreadCount(), getMissionUpdateSoundEnabled()

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
Cohesion: 0.32
Nodes (11): ImageCropDialog(), ImageCropKind, Props, canvasToBlob(), compressImageFile(), CropAreaPixels, cropImageToFile(), loadImageFromFile() (+3 more)

### Community 111 - "ReportsCityHeatmapMap.tsx"
Cohesion: 0.20
Nodes (9): MobilizeSettingsNavGroup(), NAV_ITEM_TOUCH_SX, NAV_SELECTED_SX, Props, TABS, NESTED_NAV_TOUCH_SX, Props, SidebarNestedNavItem (+1 more)

### Community 112 - "registry.ts"
Cohesion: 0.18
Nodes (20): GET(), POST(), GET(), Body, POST(), POST(), POST(), chapterStateFromProfile() (+12 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.19
Nodes (13): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringStatus, SupabaseStaleSessionCleanup(), isInvalidLoginCredentialsError(), slugify() (+5 more)

### Community 115 - "certificate-requests.ts"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 116 - "route.ts"
Cohesion: 0.17
Nodes (6): CourseProgressPage(), GatheringsPage(), LeadersPage(), ChapertsPage(), LogsPage(), DataPaneFallback()

### Community 117 - "Community 117"
Cohesion: 0.35
Nodes (7): areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), markTourStepIdsSeen(), markTourStepSeen(), readRaw(), storageKey()

### Community 118 - "MobilizeBottomNavBar.tsx"
Cohesion: 0.26
Nodes (11): LoginFallback(), LoginForm(), LoginPage(), hasSeenHint(), HIGHLIGHT, LoginSignInHighlight(), markHintSeen(), showLoginSignInHighlight() (+3 more)

### Community 119 - "parse-upload.ts"
Cohesion: 0.16
Nodes (18): hexToRgb(), MissionCardItem(), phaseHoverShadow(), CUSTOM_PARTNER_LOGO_SIZES, MISSION_PARTNER_LOGOS, missionPartnerLogoCustomSize(), MissionPartnerLogoSize, missionPartnerLogoUrl() (+10 more)

### Community 120 - "MissionBriefingPageContent.tsx"
Cohesion: 0.11
Nodes (26): ActivityFeedRow, CommunityInActionFeed(), ChapterRow, drawerLikeScrollbarSx, formatStatCompact(), NationalOverview(), UsaChapterActivityMap, isMemberOrLeader() (+18 more)

### Community 121 - "Community 121"
Cohesion: 0.52
Nodes (5): getAudioContext(), playBugleNote(), playMissionUpdateSound(), playMissionUpdateSoundAlert(), playSoundRepeated()

### Community 122 - "page.tsx"
Cohesion: 0.31
Nodes (7): SignInEmailChangePanel(), SignInEmailChangePanelProps, Mode, Props, PublicGroupJoinDialog(), formatOtpResendCountdown(), useOtpResendCooldown()

### Community 123 - "page.tsx"
Cohesion: 0.50
Nodes (5): GET(), isCommunicationsAdmin(), POST(), isPdfMagic(), normalizeAnnouncementPdfUrl()

### Community 124 - "Community 124"
Cohesion: 0.09
Nodes (38): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+30 more)

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "parse-upload.ts"
Cohesion: 0.30
Nodes (9): GET(), GET(), GroupRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), boundingBoxForRadiusKm(), deg2rad() (+1 more)

### Community 131 - "us-city-coordinates.ts"
Cohesion: 0.25
Nodes (13): countDashboardUsersMissionsStarted(), isMissionsStartedForUser(), loadMissionsStartedUserIds(), countInviteShareMetrics(), countMobilizeChapterGroups(), countStartedMissions(), countUpcomingGatherings(), loadOverviewStats() (+5 more)

### Community 132 - "route.ts"
Cohesion: 0.40
Nodes (4): Editor, EmailTemplateRichEditor(), INSERT_SHORTCODES, TinyEditor

### Community 136 - "dashboard-tour-steps.ts"
Cohesion: 0.67
Nodes (3): AnnouncementTargetUsersField(), UserOption, formatTargetUserLabel()

### Community 138 - "enrichMobilizeGroupsBrowse"
Cohesion: 0.06
Nodes (57): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), ChapterGroupsClient(), ChapterRow, GroupRow (+49 more)

### Community 140 - "Community 140"
Cohesion: 0.06
Nodes (45): formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer(), formatHandle(), formatJoinedDate() (+37 more)

### Community 144 - "ReportsChartsClient.tsx"
Cohesion: 0.32
Nodes (11): US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), escapeRegExp(), normalizeUsStateFromText(), parseStateFromUsAddress(), ResolveStateInput, STATES_BY_NAME_LEN, resolveMobilizeGroupStateCode() (+3 more)

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 146 - "overview-stats.ts"
Cohesion: 0.18
Nodes (16): POST(), correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect() (+8 more)

### Community 148 - "Community 148"
Cohesion: 0.11
Nodes (52): AK, lat, lng, AL, AR, AZ, CA, CO (+44 more)

### Community 149 - "registry.ts"
Cohesion: 0.30
Nodes (8): GET(), GET(), Body, PATCH(), isMissionBriefingAudience(), loadMissionBriefingProgress(), MissionBriefingProgressRow, loadCoachMeetingForUser()

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "usStates.ts"
Cohesion: 0.17
Nodes (4): AdminRolesPage(), ChaptersPage(), EditGatheringPage(), FirstMissionsPage()

### Community 156 - "MobilizeSocialSettingsClient.tsx"
Cohesion: 0.18
Nodes (15): GET(), PATCH(), PatchBody, STATUSES, PATCH(), PatchBody, STATUSES, addMinutesIso() (+7 more)

### Community 157 - "page.tsx"
Cohesion: 0.13
Nodes (15): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY (+7 more)

### Community 170 - "page.tsx"
Cohesion: 0.36
Nodes (7): buildCommentTree(), CommentNode, CommentRow, Ctx, GET(), loadMembership(), POST()

### Community 173 - "page.tsx"
Cohesion: 0.07
Nodes (71): Cell, PATCH(), DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET() (+63 more)

### Community 179 - "eslint"
Cohesion: 0.40
Nodes (5): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), PeopleOverviewStats

### Community 184 - "route.ts"
Cohesion: 0.36
Nodes (9): Ctx, GET(), isBlockedHost(), hasPdfExtension(), isAllowedMobilizeDocumentUrl(), isMobilizePdfUrl(), MOBILIZE_DEFAULT_CODE_OF_CONDUCT, mobilizePdfFileNameFromUrl() (+1 more)

### Community 187 - "react-leaflet"
Cohesion: 0.29
Nodes (6): assignmentSteps, checklist, IntroVideoAdminProps, Props, TrainingCommandLanding(), TrainingIntroVideoAdmin()

### Community 191 - "EmailTemplateRichEditor.tsx"
Cohesion: 0.20
Nodes (10): coerceQuizPayload(), CourseQuizFormEditor(), newQuestion(), normalizeQuestion(), Editor, EMOJI_CONFIG, GatheringDescriptionEditor(), Props (+2 more)

### Community 198 - "MobilizeGroupShareDialog.tsx"
Cohesion: 0.32
Nodes (7): logGroupShare(), MobilizeGroupShareDialog(), Props, ShareChannel, shareHref(), SharePlatform, SOCIAL_BUTTONS

### Community 200 - "UserNotesAdminClient.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

## Knowledge Gaps
- **746 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+741 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **66 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `Community 64` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 5`, `Community 8`, `Community 10`, `Community 12`, `Community 15`, `Community 16`, `Community 20`, `Community 22`, `Community 23`, `MobilizeSocialSettingsClient.tsx`, `Community 28`, `Community 32`, `Community 33`, `Community 35`, `Community 41`, `page.tsx`, `Community 60`, `Community 62`, `Community 65`, `Community 86`, `Community 91`, `Community 97`, `Community 104`, `getMailTransportAndFrom`, `registry.ts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Community 31` to `Community 32`, `Community 9`, `UserProfileDrawer.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 13`, `Community 142`, `Community 153`, `Community 154`, `Community 31`, `Community 38`, `@dnd-kit/core`, `Community 201`, `Community 202`, `Community 206`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `@mui/material-nextjs`, `next`, `nodemailer`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _746 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12917271407837447 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08871287128712871 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.07957393483709273 - nodes in this community are weakly interconnected._