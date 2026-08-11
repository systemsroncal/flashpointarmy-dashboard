# Graph Report - dashboard  (2026-08-05)

## Corpus Check
- 792 files · ~379,110 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3608 nodes · 12175 edges · 232 communities (148 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `717774df`
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
- ImageCropDialog.tsx
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
- GatheringDescriptionEditor.tsx
- isNavModuleAllowedForRoles
- CourseGraduateBadge.tsx
- ChapterInviteShareDialog.tsx
- CourseProgressUsersTable.tsx
- page.tsx
- parse-upload.ts
- UserNotesAdminClient.tsx
- page.tsx
- page.tsx
- DashboardHomeContent.tsx
- page.tsx
- page.tsx
- page.tsx
- SidebarNestedNavList.tsx
- page.tsx
- play-mission-update-sound.ts
- PermissionsContext.tsx
- DonatePageClient.tsx
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

## Communities (232 total, 84 thin omitted)

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
Cohesion: 0.25
Nodes (17): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (22): Ctx, GET(), primaryRoleLabel(), GET(), GET(), chunkIdsForInQuery(), dashboardRowFromAuthUser(), DashboardUserListRow (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (18): loadCountableCourseSessionIds(), ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, loadCoachMeetingStatusIndex(), loadCountableSessionIdsCached() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (17): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), displayNameFromUser() (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (11): ReportsPresenceDateRangeControls(), Chart, chartOpts, formatDayLabel(), formatTrend(), rangeLabel(), ReportsPresenceSection(), StatCardProps (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (13): DonationsSettingsClient(), DraftPreset, EMPTY_NEW_PACKAGE, EMPTY_NEW_PRESET, isValidHttpUrl(), NewPackageDraft, NewPresetDraft, presetToDraft() (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (19): executeBroadcastCampaign(), SendCampaignResult, sendBroadcastSms(), Branding, BroadcastShortcodes, renderBroadcastEmail(), renderBroadcastSms(), replaceShortcodes() (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.34
Nodes (12): GET(), GET(), GET(), buildUserDirectoryExportRows(), chunkArray(), collectUserIdsForRole(), fetchChapterMap(), fetchUsersByIds() (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (20): DashboardLayout(), MissionBriefingPageInner(), MissionBriefingPage(), CommandCenterBackdrop(), DashboardUserProvider(), PermissionsProvider(), loadDashboardUser(), loadTrainingGraduateBadge() (+12 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (31): capitalizeRole(), GroupMemberPreviewRow, MobilizeGroupMembersPreview(), Props, MOBILIZE_GROUP_TAB_ICONS, MOBILIZE_GROUP_TAB_NAV_SX, MobilizeGroupSidebarTabs(), NAV_ITEM_TOUCH_SX (+23 more)

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (65): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+57 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (17): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+9 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (11): OrdersListClient(), Props, STATUS_COLOR, Props, STATUS_COLOR, SubscriptionsListClient(), formatUsdFromCents(), DonationOrder (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (19): GET(), MobilizeChapterUpdatesPanel(), Props, EventNotificationCard(), JoinRequestCard(), MobilizeNotificationsClient(), notificationCardSx(), EventNotificationCard() (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (69): DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET(), PATCH(), GET() (+61 more)

### Community 23 - "Community 23"
Cohesion: 0.20
Nodes (25): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+17 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (23): DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV (+15 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.10
Nodes (33): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+25 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (15): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (14): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), CoachMeetingBookingRecord (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (17): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (11): Ctx, POST(), Props, PublicMobilizeGroupPage(), EventRow(), formatEventShort(), PublicGroupEvent, PublicGroupProfileData (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.23
Nodes (13): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker, AnnouncementDescriptionBody(), darkHtmlSx (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (10): baseOpts, Bucket, Chart, CourseCompletionRow, formatLabel(), formatStatusSlug(), PieBlock, ReportsChartsClient() (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.28
Nodes (16): GET(), POST(), GET(), POST(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic(), isMemberOnboardingAudience() (+8 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (15): config, middleware(), POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired() (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (20): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+12 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (12): POST(), GET(), GET(), Body, PATCH(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity() (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (17): DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), RunMode, RunTourOptions (+9 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (76): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), Body (+68 more)

### Community 44 - "Community 44"
Cohesion: 0.08
Nodes (37): GET(), PUT(), feedAdImageSx, MobilizeFeedAdsCarousel(), Props, AdImageBlock(), MobilizeFeedAdsRail(), Props (+29 more)

### Community 45 - "Community 45"
Cohesion: 0.08
Nodes (36): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+28 more)

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (27): GET(), GET(), GET(), parseBackHref(), parseTab(), PersonProfilePageContent(), formatAddress(), formatBirthday() (+19 more)

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (36): DELETE(), isCommunicationsAdmin(), PATCH(), PATCH(), GET(), isCommunicationsAdmin(), POST(), GET() (+28 more)

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
Cohesion: 0.17
Nodes (23): GET(), parseRoleFilter(), ProgressPageContent(), progressRoleLabel(), listDashboardUsersByIds(), listRoleNamesByUserIds(), graduateBadgeRoleFromRoles(), isUserCourseComplete() (+15 more)

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
Cohesion: 0.27
Nodes (11): createPlyrRoot(), EventVideoPlyrDialogInner(), plyrControls, PlyrLike, looksLikeDirectMedia(), pickDailymotionEmbed(), pickVimeoId(), pickYoutubeId() (+3 more)

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (7): ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption, ConversationSummary, DirectMessageRow, MESSAGES_EMPTY

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (38): cards, MobilizeHomePage(), ChangePasswordDialog(), HeaderSuperAdminProfileAvatar(), SOCIAL_MENU_ICONS, CHAPTERS_ICONS, MobilizeBottomNav(), MobilizeChaptersBottomNav() (+30 more)

### Community 61 - "Community 61"
Cohesion: 0.13
Nodes (23): GET(), GET(), POST(), GET(), GET(), GroupRow, DuRow, emptyExtras() (+15 more)

### Community 62 - "Community 62"
Cohesion: 0.18
Nodes (15): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), listAllDashboardUsers(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.16
Nodes (17): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+9 more)

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
Cohesion: 0.28
Nodes (10): PATCH(), PatchBody, ResolvedUserEmail, resolveUserEmailForDelivery(), escapeHtml(), notifyCertificateRequestReviewed(), NotifyParams, resolveUserContact() (+2 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.10
Nodes (30): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, coerceQuizPayload(), CourseQuizFormEditor(), newQuestion() (+22 more)

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
Cohesion: 0.48
Nodes (6): CITY_COORDS, cityLookupKey(), hashString(), jitterAroundCentroid(), resolveCityCoordinates(), STATE_CENTROIDS

### Community 87 - "Community 87"
Cohesion: 0.33
Nodes (9): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, inviteShareChannelLabel(), isInviteShareChannel() (+1 more)

### Community 88 - "Community 88"
Cohesion: 0.05
Nodes (52): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), ChapterGroupsClient(), ChapterRow, GroupRow (+44 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.08
Nodes (29): Cell, PATCH(), GET(), InviteBody, POST(), POST(), POST(), POST() (+21 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.13
Nodes (15): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY (+7 more)

### Community 94 - "Community 94"
Cohesion: 0.22
Nodes (17): DELETE(), getSessionAndPermissions(), PATCH(), PatchBody, PATCH(), PatchBody, GET(), PATCH() (+9 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.07
Nodes (51): DashboardWelcome(), MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeCollapsiblePostBody(), Props, MobilizeGroupFeed() (+43 more)

### Community 97 - "Community 97"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 98 - "Community 98"
Cohesion: 0.15
Nodes (22): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), ChapterOption, RegisterPage(), MaintenancePage() (+14 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.13
Nodes (21): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+13 more)

### Community 100 - "page.tsx"
Cohesion: 0.15
Nodes (26): canManageEvents(), Ctx, GET(), isApprovedMember(), POST(), Ctx, GET(), normalizeStateCode() (+18 more)

### Community 101 - "Community 101"
Cohesion: 0.04
Nodes (52): capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow, Membership, MessageRow (+44 more)

### Community 102 - "Community 102"
Cohesion: 0.57
Nodes (5): POST(), RouteCtx, rowToCampaign(), requireBroadcastSend(), BroadcastCampaignRow

### Community 103 - "Community 103"
Cohesion: 0.32
Nodes (10): Ctx, POST(), getMobilizeResourcesPostAccess(), MobilizeResourcesPostAccess, ALLOWED_MIME, detectResourceDocumentExt(), extFromName(), isPdf() (+2 more)

### Community 104 - "Community 104"
Cohesion: 0.13
Nodes (33): GET(), isIsoDate(), POST(), PostBody, chaptersForStateFilter(), chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed() (+25 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.08
Nodes (41): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+33 more)

### Community 106 - "Community 106"
Cohesion: 0.06
Nodes (34): MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, MobilizeRecommendationsCard(), Props (+26 more)

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
Cohesion: 0.18
Nodes (11): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+3 more)

### Community 111 - "CourseGraduateBadge.tsx"
Cohesion: 0.53
Nodes (4): SignInEmailChangePanel(), SignInEmailChangePanelProps, formatOtpResendCountdown(), useOtpResendCooldown()

### Community 112 - "registry.ts"
Cohesion: 0.29
Nodes (11): countInviteShareMetrics(), countMobilizeChapterGroups(), countStartedMissions(), countUpcomingGatherings(), loadOverviewStats(), loadStatePopupStats(), normalizeStateCode(), OverviewScope (+3 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.14
Nodes (21): POST(), FirstLoginPasswordGate(), SupabaseStaleSessionCleanup(), countPresenceUsers(), DashboardPresenceContext, DashboardPresenceProvider(), DashboardPresenceValue, normalizeAuthEmail() (+13 more)

### Community 115 - "Community 115"
Cohesion: 0.21
Nodes (16): Ctx, GET(), isApprovedMember(), POST(), GET(), Ctx, POST(), isValidAnnouncementImagePath() (+8 more)

### Community 116 - "route.ts"
Cohesion: 0.17
Nodes (5): BroadcastHistoryPage(), EditCoursePage(), CourseProgressPage(), EventCategoriesPage(), LeadersPage()

### Community 117 - "Community 117"
Cohesion: 0.19
Nodes (17): POST(), GET(), POST(), rowToCampaign(), ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience() (+9 more)

### Community 119 - "parse-upload.ts"
Cohesion: 0.25
Nodes (9): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS (+1 more)

### Community 120 - "EditCoursePageContent.tsx"
Cohesion: 0.36
Nodes (5): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo

### Community 121 - "Community 121"
Cohesion: 0.42
Nodes (6): GET(), AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders()

### Community 123 - "page.tsx"
Cohesion: 0.20
Nodes (16): MobilizeChapterFeedBanner(), Props, US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), escapeRegExp(), normalizeUsStateFromText(), parseStateFromUsAddress(), ResolveStateInput (+8 more)

### Community 124 - "Community 124"
Cohesion: 0.18
Nodes (14): correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect(), CourseElementType (+6 more)

### Community 126 - "Community 126"
Cohesion: 0.53
Nodes (6): appBaseUrl(), POST(), presetAllowsMode(), resolvePresetAmountCents(), isStripeConfigured(), DonationAmountPreset

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "Community 128"
Cohesion: 0.18
Nodes (17): DashboardTourActions, prepareSidebarTarget(), scrollTourTargetIntoView(), tourAttr(), buildMainDashboardTourEntries(), DashboardTourBuildInput, filterUnseenEntries(), highlightHook() (+9 more)

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "page.tsx"
Cohesion: 0.48
Nodes (6): sendBroadcastEmail(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 131 - "Community 131"
Cohesion: 0.39
Nodes (6): POST(), createDonationCheckoutSession(), getStripeClient(), RecurringPrice, stripeRecurring(), DonationPaymentMode

### Community 132 - "training-feed.ts"
Cohesion: 0.10
Nodes (33): GET(), GET(), GET(), GET(), POST(), Ctx, GET(), GET() (+25 more)

### Community 133 - "Community 133"
Cohesion: 0.30
Nodes (8): AnnouncementsNavBadge(), MissionUpdatesNavIcon(), MissionUpdatesUnreadContext, MissionUpdatesUnreadContextValue, MissionUpdatesUnreadProvider(), useMissionUpdatesUnread(), NotificationsDrawerUnreadCount(), getMissionUpdateSoundEnabled()

### Community 134 - "Community 134"
Cohesion: 0.36
Nodes (7): buildCommentTree(), CommentNode, CommentRow, Ctx, GET(), loadMembership(), POST()

### Community 135 - "Community 135"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 136 - "Community 136"
Cohesion: 0.32
Nodes (4): MobilizeSocialSettingsClient(), SettingsPayload, MobilizeSocialSettingsForm(), Props

### Community 138 - "nprogress"
Cohesion: 0.09
Nodes (37): Ctx, isApprovedMember(), POST(), Ctx, loadMembership(), POST(), DELETE(), GET() (+29 more)

### Community 140 - "Community 140"
Cohesion: 0.14
Nodes (20): MissionRankInfoDialog(), Props, formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer() (+12 more)

### Community 141 - "ImageCropDialog.tsx"
Cohesion: 0.36
Nodes (10): ImageCropKind, Props, canvasToBlob(), compressImageFile(), CropAreaPixels, cropImageToFile(), loadImageFromFile(), loadImageFromUrl() (+2 more)

### Community 143 - "DonationsSettingsClient.tsx"
Cohesion: 0.40
Nodes (4): Editor, EmailTemplateRichEditor(), INSERT_SHORTCODES, TinyEditor

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 146 - "page.tsx"
Cohesion: 0.22
Nodes (11): createDriverInstance(), noopOverlayClick(), areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), hasAutoTourCompleted(), markAutoTourCompleted(), markTourStepIdsSeen() (+3 more)

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
Cohesion: 0.21
Nodes (19): LeadersPageContent(), NotificationsPageContent(), PeoplePage(), PeoplePageContent(), isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav() (+11 more)

### Community 164 - "CourseGraduateBadge.tsx"
Cohesion: 0.22
Nodes (8): AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog(), graduateDisplayName(), OVERLAY_REF, overlayMetrics(), TrainingGraduateBadgeRole

### Community 165 - "ChapterInviteShareDialog.tsx"
Cohesion: 0.33
Nodes (3): ChapterMapInviteCta(), SharePlatform, SOCIAL_BUTTONS

### Community 166 - "CourseProgressUsersTable.tsx"
Cohesion: 0.40
Nodes (4): InviteFriendsBanner(), CourseIntroVideoBlock(), Props, ExternalTrainingCertificateBanner()

### Community 168 - "parse-upload.ts"
Cohesion: 0.33
Nodes (7): barColorForPercent(), COLORS, geographyToStateCode(), HEAT_STOPS, heatFill(), ReportsStateDemographicMap(), RsmGeo

### Community 169 - "UserNotesAdminClient.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 172 - "DashboardHomeContent.tsx"
Cohesion: 0.62
Nodes (4): GET(), DashboardHomeContent(), includeReferenceInOverviewStatTotals(), sumReferenceTotals()

### Community 176 - "SidebarNestedNavList.tsx"
Cohesion: 0.40
Nodes (4): NESTED_NAV_TOUCH_SX, Props, SidebarNestedNavItem, SidebarNestedNavList()

### Community 178 - "play-mission-update-sound.ts"
Cohesion: 0.42
Nodes (6): playCommunityActionSoundAlert(), getAudioContext(), playBugleNote(), playMissionUpdateSound(), playMissionUpdateSoundAlert(), playSoundRepeated()

### Community 179 - "PermissionsContext.tsx"
Cohesion: 0.50
Nodes (4): PermissionsContext, useCan(), usePermissions(), CrudKey

### Community 180 - "DonatePageClient.tsx"
Cohesion: 0.33
Nodes (7): cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl(), PartnershipCard(), Props

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

- **Why does `createAdminClient()` connect `Community 43` to `Community 1`, `Community 2`, `Community 131`, `Community 3`, `Community 4`, `Community 6`, `Community 13`, `Community 14`, `Community 16`, `Community 22`, `Community 23`, `Community 32`, `isNavModuleAllowedForRoles`, `Community 40`, `DashboardHomeContent.tsx`, `Community 45`, `Community 46`, `Community 47`, `Community 51`, `route.ts`, `Community 64`, `Community 67`, `Community 82`, `Community 85`, `Community 91`, `Community 94`, `Community 97`, `page.tsx`, `Community 102`, `Community 104`, `getMailTransportAndFrom`, `Community 117`, `Community 126`?**
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
- **Should `Community 9` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._