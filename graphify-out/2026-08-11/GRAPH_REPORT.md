# Graph Report - dashboard  (2026-08-05)

## Corpus Check
- 792 files · ~379,113 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3608 nodes · 12177 edges · 219 communities (135 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9bf59582`
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
- registry.ts
- Community 113
- loadMobilizeGroupCreatorPolicy
- route.ts
- Community 117
- MobilizeBottomNavBar.tsx
- parse-upload.ts
- Community 121
- page.tsx
- page.tsx
- Community 124
- Community 125
- Community 126
- Community 127
- Community 129
- page.tsx
- training-feed.ts
- Community 135
- Community 136
- Community 137
- nprogress
- Community 139
- Community 140
- ImageCropDialog.tsx
- Community 142
- DonationsSettingsClient.tsx
- Community 144
- Community 145
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
- GatheringDescriptionEditor.tsx
- isNavModuleAllowedForRoles
- ChapterInviteShareDialog.tsx
- CourseProgressUsersTable.tsx
- page.tsx
- UserNotesAdminClient.tsx
- page.tsx
- page.tsx
- DashboardHomeContent.tsx
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- play-mission-update-sound.ts
- react-easy-crop
- page.tsx
- CourseIntroVideoBlock.tsx
- route.ts
- page.tsx
- page.tsx
- page.tsx
- page.tsx
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
1. `createAdminClient()` - 294 edges
2. `requireApiAuth()` - 276 edges
3. `loadUserRoleNames()` - 267 edges
4. `can()` - 209 edges
5. `loadModulePermissions()` - 208 edges
6. `requireMobilizeRead()` - 154 edges
7. `isElevatedRole()` - 130 edges
8. `requireServerUser()` - 119 edges
9. `MODULE_SLUGS` - 114 edges
10. `createClient()` - 106 edges

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

## Communities (219 total, 84 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (32): POST(), POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST() (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (83): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+75 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (46): fetchPresenceRowsInRange(), GET(), PresenceRow, barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (22): Ctx, GET(), primaryRoleLabel(), GET(), GET(), chunkIdsForInQuery(), dashboardRowFromAuthUser(), DashboardUserListRow (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (26): FirstMissionData, Props, Row, AdminStaffSearchAutocomplete(), Props, loadCountableCourseSessionIds(), resolveCoachMeetingStepStatus(), TrainingStepStatus (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (21): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), PatchBody (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (14): GET(), rowToCampaign(), GET(), PATCH(), RouteCtx, DELETE(), GET(), PATCH() (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (37): POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl(), PartnershipCard(), Props (+29 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (15): Branding, BroadcastShortcodes, renderBroadcastSms(), replaceShortcodes(), displayNameForRecipient(), shortcodesForRecipient(), BroadcastRecipient, EmailBranding (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.26
Nodes (16): GET(), parseRoleFilter(), GET(), GET(), GET(), CourseProgressExportRoleFilter, buildUserDirectoryExportRows(), chunkArray() (+8 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (22): DashboardLayout(), MissionBriefingPageInner(), MissionBriefingPage(), CommandCenterBackdrop(), DashboardUserProvider(), PermissionsContext, PermissionsProvider(), useCan() (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (30): capitalizeRole(), GroupMemberPreviewRow, MobilizeGroupMembersPreview(), Props, MOBILIZE_GROUP_TAB_ICONS, MOBILIZE_GROUP_TAB_NAV_SX, MobilizeGroupSidebarTabs(), NAV_ITEM_TOUCH_SX (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (44): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+36 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (28): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+20 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (14): GET(), PUT(), cleanOptionalToken(), isSafeFeedAdHref(), isSafeFeedAdImageUrl(), loadMobilizeFeedAds(), parseBlockTitle(), parseCarouselBlock() (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (19): GET(), MobilizeChapterUpdatesPanel(), Props, EventNotificationCard(), JoinRequestCard(), MobilizeNotificationsClient(), notificationCardSx(), EventNotificationCard() (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.07
Nodes (67): DELETE(), DELETE(), PATCH(), GET(), PATCH(), PatchBody, STATUSES, PATCH() (+59 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (39): AnnouncementsNavBadge(), DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS (+31 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (33): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+25 more)

### Community 27 - "Community 27"
Cohesion: 0.13
Nodes (21): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+13 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (16): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), CoachMeetingBookingRecord (+8 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (17): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.08
Nodes (40): GET(), GET(), POST(), GET(), loadAutoCloseDays(), loadViewerSettings(), PUT(), requireSuperAdmin() (+32 more)

### Community 33 - "Community 33"
Cohesion: 0.52
Nodes (6): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (11): MobilizeDialog(), emptyForm(), MobilizeGroupResourcesPanel(), MobilizeResourceRow, MobilizeResourceType, Props, ResourceForm, TYPE_ICONS (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.35
Nodes (13): GET(), POST(), GET(), POST(), coachMeetingKindForAudience(), coachMeetingTopic(), isMemberOnboardingAudience(), loadTrainingStepStatus() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.13
Nodes (23): config, middleware(), POST(), POST(), POST(), Home(), normalizeAuthEmail(), getServerAuth() (+15 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (20): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+12 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (13): POST(), GET(), GET(), Body, PATCH(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity() (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.08
Nodes (45): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+37 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (67): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), PATCH() (+59 more)

### Community 44 - "Community 44"
Cohesion: 0.08
Nodes (25): MobilizeFeedAdImageDropzone(), Props, feedAdImageSx, MobilizeFeedAdsCarousel(), Props, AdImageBlock(), MobilizeFeedAdsRail(), Props (+17 more)

### Community 45 - "Community 45"
Cohesion: 0.09
Nodes (34): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+26 more)

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (27): GET(), GET(), GET(), parseBackHref(), parseTab(), PersonProfilePageContent(), formatAddress(), formatBirthday() (+19 more)

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (38): DELETE(), isCommunicationsAdmin(), PATCH(), PATCH(), GET(), isCommunicationsAdmin(), POST(), GET() (+30 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.16
Nodes (17): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+9 more)

### Community 51 - "Community 51"
Cohesion: 0.24
Nodes (18): ProgressPageContent(), progressRoleLabel(), listDashboardUsersByIds(), preferNonEmptyAddr(), graduateBadgeRoleFromRoles(), loadCourseSessionIds(), loadTrainingGraduateBadgesForUsers(), computeCourseCompletionRow() (+10 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (16): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+8 more)

### Community 53 - "Community 53"
Cohesion: 0.18
Nodes (10): JourneyWelcomeDialog(), Props, RICH_CONTENT_SX, BriefingVideoAdmin(), BRIEFING_WELCOME, MissionBriefingLanding(), Props, MissionBriefingPlayer() (+2 more)

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
Cohesion: 0.12
Nodes (27): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+19 more)

### Community 59 - "Community 59"
Cohesion: 0.14
Nodes (18): GET(), GET(), POST(), ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption, buildConversationSummaries() (+10 more)

### Community 60 - "Community 60"
Cohesion: 0.06
Nodes (42): cards, MobilizeHomePage(), DashboardWelcome(), HeaderSuperAdminProfileAvatar(), SOCIAL_MENU_ICONS, isNationalOverviewHome(), RoleWelcomeVideoPrompt(), CHAPTERS_ICONS (+34 more)

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (12): GET(), GET(), GroupRow, DuRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), MobilizeGroupBrowseExtras (+4 more)

### Community 62 - "Community 62"
Cohesion: 0.18
Nodes (15): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), listAllDashboardUsers(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.26
Nodes (11): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, formatCoachMeetingWhen(), fromDatetimeLocalValue(), OnboardingStatusChip(), toDatetimeLocalValue() (+3 more)

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
Cohesion: 0.27
Nodes (10): PATCH(), PatchBody, ResolvedUserEmail, resolveUserEmailForDelivery(), escapeHtml(), notifyCertificateRequestReviewed(), NotifyParams, resolveUserContact() (+2 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.14
Nodes (23): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, coerceQuizPayload(), CourseQuizFormEditor(), newQuestion() (+15 more)

### Community 76 - "Community 76"
Cohesion: 0.32
Nodes (12): ActivityFeedRow, displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle() (+4 more)

### Community 82 - "Community 82"
Cohesion: 0.24
Nodes (13): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), getZonedParts(), isThursdayNoonInTimeZone(), isWeeklyMembersPostWindow(), lastAutoFeedAt() (+5 more)

### Community 84 - "Community 84"
Cohesion: 0.21
Nodes (14): CommunityInActionFeed(), ChapterRow, drawerLikeScrollbarSx, NationalOverview(), UsaChapterActivityMap, isMemberOrLeader(), CommunityActivityFeedRow, HIDDEN_COMMUNITY_FEED_CATEGORIES (+6 more)

### Community 85 - "Community 85"
Cohesion: 0.37
Nodes (11): GET(), isBucket(), fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket, enumerateBucketLabels(), pad2() (+3 more)

### Community 86 - "Community 86"
Cohesion: 0.21
Nodes (11): CommentComposer(), CommentItem(), countComments(), MobilizeSocialComments(), Props, SocialCommentNode, timeAgo(), formatRelativeTime() (+3 more)

### Community 87 - "Community 87"
Cohesion: 0.33
Nodes (9): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, inviteShareChannelLabel(), isInviteShareChannel() (+1 more)

### Community 88 - "Community 88"
Cohesion: 0.05
Nodes (51): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), ChapterGroupsClient(), ChapterRow, GroupRow (+43 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.11
Nodes (25): Cell, Body, POST(), POST(), POST(), ALLOWED_KEYS, PATCH(), MobilizeSettingsPage() (+17 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.12
Nodes (18): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY (+10 more)

### Community 94 - "Community 94"
Cohesion: 0.22
Nodes (17): DELETE(), getSessionAndPermissions(), PATCH(), PatchBody, PATCH(), PatchBody, GET(), PATCH() (+9 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.05
Nodes (59): MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeCollapsiblePostBody(), Props, MobilizeGroupFeed(), Props (+51 more)

### Community 97 - "Community 97"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 98 - "Community 98"
Cohesion: 0.11
Nodes (28): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), ChapterOption, RegisterPage(), MaintenancePage() (+20 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.13
Nodes (21): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+13 more)

### Community 100 - "page.tsx"
Cohesion: 0.14
Nodes (30): Ctx, GET(), normalizeStateCode(), GET(), Ctx, DELETE(), loadMembership(), PATCH() (+22 more)

### Community 101 - "Community 101"
Cohesion: 0.06
Nodes (41): Ctx, POST(), capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow (+33 more)

### Community 102 - "Community 102"
Cohesion: 0.27
Nodes (9): Ctx, DELETE(), GET(), PATCH(), applyMobilizeGroupOwnerAndLeaders(), countApprovedLeaders(), demoteApprovedLeaderToMember(), ensureApprovedLeader() (+1 more)

### Community 103 - "Community 103"
Cohesion: 0.21
Nodes (16): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+8 more)

### Community 104 - "Community 104"
Cohesion: 0.12
Nodes (36): GET(), isIsoDate(), POST(), PostBody, chaptersForStateFilter(), chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed() (+28 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.09
Nodes (32): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+24 more)

### Community 106 - "Community 106"
Cohesion: 0.12
Nodes (17): MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, MobilizeSocialFeedShell(), Props (+9 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 108 - "Community 108"
Cohesion: 0.18
Nodes (14): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+6 more)

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 110 - "Community 110"
Cohesion: 0.57
Nodes (5): canManageEvents(), Ctx, GET(), isApprovedMember(), POST()

### Community 112 - "registry.ts"
Cohesion: 0.29
Nodes (11): countInviteShareMetrics(), countMobilizeChapterGroups(), countStartedMissions(), countUpcomingGatherings(), loadOverviewStats(), loadStatePopupStats(), normalizeStateCode(), OverviewScope (+3 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.14
Nodes (18): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringForm(), GatheringStatus, SupabaseStaleSessionCleanup(), countPresenceUsers() (+10 more)

### Community 116 - "route.ts"
Cohesion: 0.17
Nodes (5): BroadcastHistoryPage(), EditCoursePage(), CourseProgressPage(), EventCategoriesPage(), LeadersPage()

### Community 117 - "Community 117"
Cohesion: 0.21
Nodes (16): POST(), GET(), POST(), rowToCampaign(), ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience() (+8 more)

### Community 119 - "parse-upload.ts"
Cohesion: 0.25
Nodes (9): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS (+1 more)

### Community 121 - "Community 121"
Cohesion: 0.20
Nodes (16): POST(), RouteCtx, rowToCampaign(), GET(), requireBroadcastSend(), executeBroadcastCampaign(), SendCampaignResult, AvailableProviders (+8 more)

### Community 123 - "page.tsx"
Cohesion: 0.20
Nodes (16): MobilizeChapterFeedBanner(), Props, US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), escapeRegExp(), normalizeUsStateFromText(), parseStateFromUsAddress(), ResolveStateInput (+8 more)

### Community 124 - "Community 124"
Cohesion: 0.46
Nodes (7): correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect()

### Community 126 - "Community 126"
Cohesion: 0.64
Nodes (5): appBaseUrl(), POST(), presetAllowsMode(), resolvePresetAmountCents(), isStripeConfigured()

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "page.tsx"
Cohesion: 0.48
Nodes (6): sendBroadcastEmail(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 132 - "training-feed.ts"
Cohesion: 0.10
Nodes (28): buildCommentTree(), CommentNode, CommentRow, Ctx, GET(), loadMembership(), POST(), GET() (+20 more)

### Community 135 - "Community 135"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 136 - "Community 136"
Cohesion: 0.32
Nodes (4): MobilizeSocialSettingsClient(), SettingsPayload, MobilizeSocialSettingsForm(), Props

### Community 138 - "nprogress"
Cohesion: 0.09
Nodes (38): Ctx, isApprovedMember(), POST(), Ctx, loadMembership(), POST(), DELETE(), GET() (+30 more)

### Community 140 - "Community 140"
Cohesion: 0.13
Nodes (21): ChangePasswordDialog(), MissionRankInfoDialog(), Props, formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow (+13 more)

### Community 141 - "ImageCropDialog.tsx"
Cohesion: 0.32
Nodes (11): ImageCropDialog(), ImageCropKind, Props, canvasToBlob(), compressImageFile(), CropAreaPixels, cropImageToFile(), loadImageFromFile() (+3 more)

### Community 143 - "DonationsSettingsClient.tsx"
Cohesion: 0.40
Nodes (4): Editor, EmailTemplateRichEditor(), INSERT_SHORTCODES, TinyEditor

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 148 - "Community 148"
Cohesion: 0.11
Nodes (52): AK, lat, lng, AL, AR, AZ, CA, CO (+44 more)

### Community 149 - "Community 149"
Cohesion: 0.17
Nodes (6): ChaptersPage(), BroadcastTemplatesPage(), LogsPage(), CoachMeetingsPage(), ReportsPage(), DataPaneFallback()

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "Community 152"
Cohesion: 0.43
Nodes (5): GET(), extractTopicsFromText(), HubTopic, loadMobilizeHubSidebar(), SuggestedGroupRow

### Community 160 - "Community 160"
Cohesion: 0.16
Nodes (18): hexToRgb(), MissionCardItem(), phaseHoverShadow(), CUSTOM_PARTNER_LOGO_SIZES, MISSION_PARTNER_LOGOS, missionPartnerLogoCustomSize(), MissionPartnerLogoSize, missionPartnerLogoUrl() (+10 more)

### Community 162 - "isNavModuleAllowedForRoles"
Cohesion: 0.23
Nodes (17): PeoplePage(), PeoplePageContent(), isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES, MEMBER_NAV_MODULES (+9 more)

### Community 165 - "ChapterInviteShareDialog.tsx"
Cohesion: 0.33
Nodes (3): ChapterMapInviteCta(), SharePlatform, SOCIAL_BUTTONS

### Community 166 - "CourseProgressUsersTable.tsx"
Cohesion: 0.40
Nodes (4): InviteFriendsBanner(), CourseIntroVideoBlock(), Props, ExternalTrainingCertificateBanner()

### Community 169 - "UserNotesAdminClient.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 172 - "DashboardHomeContent.tsx"
Cohesion: 0.62
Nodes (4): GET(), DashboardHomeContent(), includeReferenceInOverviewStatTotals(), sumReferenceTotals()

### Community 178 - "play-mission-update-sound.ts"
Cohesion: 0.42
Nodes (6): playCommunityActionSoundAlert(), getAudioContext(), playBugleNote(), playMissionUpdateSound(), playMissionUpdateSoundAlert(), playSoundRepeated()

### Community 186 - "CourseIntroVideoBlock.tsx"
Cohesion: 0.29
Nodes (6): assignmentSteps, checklist, IntroVideoAdminProps, Props, TrainingCommandLanding(), TrainingIntroVideoAdmin()

### Community 188 - "route.ts"
Cohesion: 0.70
Nodes (4): GET(), parseFilter(), parseJourneyProgressSortAscending(), parseJourneyProgressSortKey()

## Knowledge Gaps
- **692 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+687 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `Community 43` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 13`, `Community 14`, `Community 16`, `Community 22`, `Community 23`, `Community 32`, `isNavModuleAllowedForRoles`, `Community 40`, `DashboardHomeContent.tsx`, `Community 45`, `Community 46`, `Community 47`, `Community 51`, `route.ts`, `Community 64`, `Community 67`, `Community 82`, `Community 85`, `Community 91`, `Community 94`, `Community 97`, `Community 104`, `getMailTransportAndFrom`, `Community 110`, `Community 117`, `Community 121`, `Community 126`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Community 31` to `Community 9`, `UserProfileDrawer.tsx`, `Community 13`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 144`, `Community 147`, `Community 153`, `Community 154`, `Community 28`, `Community 31`, `react-easy-crop`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `Community 95`, `@mui/material-nextjs`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _692 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12188552188552189 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08928231486769465 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.07486338797814207 - nodes in this community are weakly interconnected._