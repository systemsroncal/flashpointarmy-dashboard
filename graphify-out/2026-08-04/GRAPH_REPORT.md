# Graph Report - dashboard  (2026-08-04)

## Corpus Check
- 791 files · ~378,597 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3617 nodes · 12188 edges · 220 communities (137 shown, 83 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47e02e76`
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
- GatheringDescriptionEditor.tsx
- isNavModuleAllowedForRoles
- page.tsx
- parse-upload.ts
- UserNotesAdminClient.tsx
- page.tsx
- page.tsx
- Community 172
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- react-easy-crop
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

## Communities (220 total, 83 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (28): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (82): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+74 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (17): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.26
Nodes (10): chunkIdsForInQuery(), dashboardRowFromAuthUser(), DashboardUserListRow, listUserRoleJoinsByUserIds(), ProfileMailRow, profileRowsWithMailingDefaults(), RoleJoinRow, countDashboardUsersMissionsStarted() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (19): loadCountableCourseSessionIds(), ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, listOnboardingMemberUserIds(), loadCoachMeetingStatusIndex() (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.20
Nodes (18): GET(), parseCoachMeetingStatus(), GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), displayNameFromUser() (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (11): ReportsPresenceDateRangeControls(), Chart, chartOpts, formatDayLabel(), formatTrend(), rangeLabel(), ReportsPresenceSection(), StatCardProps (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (20): GET(), executeBroadcastCampaign(), SendCampaignResult, AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders() (+12 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (45): Body, POST(), POST(), Cell, PATCH(), Body, POST(), GET() (+37 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (21): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.27
Nodes (17): GET(), parseRoleFilter(), GET(), GET(), GET(), CourseProgressExportRoleFilter, assertSuperAdminExportAccess(), buildUserDirectoryExportRows() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.19
Nodes (16): POST(), MissionsPage(), MissionBriefingPageInner(), MissionBriefingPage(), MissionsLanding(), JourneyMilestones, loadJourneyMilestones(), createAdminCompletedJourneySnapshot() (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.17
Nodes (11): Editor, EmailTemplateRichEditor(), INSERT_SHORTCODES, TinyEditor, coerceQuizPayload(), CourseQuizFormEditor(), newQuestion(), normalizeQuestion() (+3 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (43): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+35 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (13): GET(), Props, MobilizeSocialHubRightRail(), Props, MobilizeSocialSettingsClient(), SettingsPayload, MobilizeSocialSettingsForm(), Props (+5 more)

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
Nodes (23): GET(), JoinReq, MobilizeNotificationsPage(), MobilizeChapterUpdatesPanel(), Props, EventNotificationCard(), JoinRequestCard(), MobilizeNotificationsClient() (+15 more)

### Community 22 - "Community 22"
Cohesion: 0.07
Nodes (57): DELETE(), DELETE(), DELETE(), DELETE(), AdminRolesPageContent(), AdminsPageContent(), BroadcastHistoryPageContent(), BroadcastSendPageContent() (+49 more)

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (23): attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET(), UserRoleRow (+15 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (26): DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV (+18 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (32): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+24 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (13): CourseSessionPage(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey(), videoDurationStorageKey() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (18): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (15): GET(), PATCH(), PatchBody, STATUSES, PATCH(), PatchBody, STATUSES, addMinutesIso() (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.14
Nodes (17): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (13): Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE(), GET(), PATCH() (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.13
Nodes (23): GET(), Ctx, POST(), Ctx, GET(), primaryRoleLabel(), GET(), POST() (+15 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (18): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+10 more)

### Community 36 - "Community 36"
Cohesion: 0.35
Nodes (13): GET(), POST(), GET(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic(), MissionRankAudience, loadCoachMeetingForUser() (+5 more)

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
Cohesion: 0.10
Nodes (28): GET(), loadExcludedAdminUserIds(), POST(), PostBody, POST(), POST(), Body, POST() (+20 more)

### Community 41 - "Community 41"
Cohesion: 0.13
Nodes (23): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+15 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.08
Nodes (51): POST(), POST(), POST(), DELETE(), getSessionAndPermissions(), PATCH(), PatchBody, PATCH() (+43 more)

### Community 44 - "Community 44"
Cohesion: 0.11
Nodes (26): GET(), PUT(), AdBlockThumbnail(), blockLabel(), blockPreviewImageUrl(), MobilizeFeedAdsSettingsForm(), CREATOR_ROLE_OPTIONS, MobilizePolicySettingsForm() (+18 more)

### Community 45 - "Community 45"
Cohesion: 0.06
Nodes (45): formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX, SessionCard(), SessionCardModel (+37 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (23): GET(), parseBackHref(), parseTab(), PersonProfilePageContent(), formatAddress(), formatBirthday(), formatGender(), formatRole() (+15 more)

### Community 47 - "Community 47"
Cohesion: 0.08
Nodes (51): DELETE(), isCommunicationsAdmin(), PATCH(), DELETE(), PATCH(), GET(), isCommunicationsAdmin(), POST() (+43 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): destRoot, __dirname, p, root, srcRoot

### Community 49 - "Community 49"
Cohesion: 0.28
Nodes (5): fpa_ff_dedupe_can_access(), fpa_ff_flatten_response(), fpa_ff_parse_submission_row(), fpa_ff_pick_contact_fields(), WP_REST_Request

### Community 50 - "Community 50"
Cohesion: 0.11
Nodes (24): ActivityTier, colorForTier(), COLORS, DEFAULT_MAP_VIEW, geographyToStateCode(), LARGE_STATES, LEGEND_ITEMS, MapView (+16 more)

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (20): ProgressPageContent(), progressRoleLabel(), listDashboardUsersByIds(), listProfilesByIds(), listRoleNamesByUserIds(), preferNonEmptyAddr(), graduateBadgeRoleFromRoles(), loadCourseSessionIds() (+12 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (16): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+8 more)

### Community 53 - "Community 53"
Cohesion: 0.06
Nodes (48): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), ChapterRow, GroupRow, ViewMode (+40 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.23
Nodes (13): chunkIds(), NotificationMenu(), NotificationRow, MobilizeNavNotificationsBadge(), EMPTY, notificationKeys(), useMobilizeNotifications(), formatNotificationDisplay() (+5 more)

### Community 56 - "Community 56"
Cohesion: 0.21
Nodes (18): backup_env_files(), ensure_git_safe_directory(), ensure_repo_owned_by_deploy_owner(), free_listen_port(), kill_next_on_port(), kill_pids_on_port(), maybe_sudo(), PORT (+10 more)

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (4): child, { execSync, spawn }, path, port

### Community 58 - "Community 58"
Cohesion: 0.16
Nodes (22): GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx, GET() (+14 more)

### Community 59 - "Community 59"
Cohesion: 0.22
Nodes (7): ConversationListItem(), formatMessageTime(), MobilizeMessagesClient(), RecipientOption, ConversationSummary, DirectMessageRow, MESSAGES_EMPTY

### Community 60 - "Community 60"
Cohesion: 0.04
Nodes (76): cards, MobilizeHomePage(), DashboardWelcome(), HeaderSuperAdminProfileAvatar(), SOCIAL_MENU_ICONS, CHAPTERS_ICONS, ChaptersProps, GROUP_TAB_ICONS (+68 more)

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (8): GET(), GroupRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), boundingBoxForRadiusKm(), deg2rad(), haversineKm()

### Community 62 - "Community 62"
Cohesion: 0.22
Nodes (15): GET(), DashboardHomeContent(), DashboardHomePage(), listAllDashboardUsers(), includeReferenceInOverviewStatTotals(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit (+7 more)

### Community 63 - "Community 63"
Cohesion: 0.16
Nodes (18): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+10 more)

### Community 64 - "Community 64"
Cohesion: 0.19
Nodes (26): RFC-5322, GET(), PATCH(), requireSuperAdmin(), GET(), getGmailOAuthRedirectUri(), decryptDeliverySecrets(), DeliverySettingsPatch (+18 more)

### Community 65 - "Community 65"
Cohesion: 0.11
Nodes (31): countUsersRegistered(), GET(), baseOpts, Bucket, Chart, CourseCompletionRow, formatLabel(), formatStatusSlug() (+23 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.36
Nodes (8): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), coachMeetingScheduleLabel()

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.24
Nodes (15): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, blockTitleHtmlFromPlain(), blockTitlePlainFromHtml(), collectCourseBlockValidationIssues() (+7 more)

### Community 76 - "Community 76"
Cohesion: 0.13
Nodes (18): CourseQuizBlock(), EventDescriptionHtml(), Props, correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore() (+10 more)

### Community 82 - "Community 82"
Cohesion: 0.24
Nodes (13): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), getZonedParts(), isThursdayNoonInTimeZone(), isWeeklyMembersPostWindow(), lastAutoFeedAt() (+5 more)

### Community 84 - "Community 84"
Cohesion: 0.16
Nodes (17): ActivityFeedRow, CommunityInActionFeed(), ChapterRow, drawerLikeScrollbarSx, NationalOverview(), UsaChapterActivityMap, isMemberOrLeader(), CommunityActivityFeedRow (+9 more)

### Community 85 - "Community 85"
Cohesion: 0.37
Nodes (11): GET(), isBucket(), fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket, enumerateBucketLabels(), pad2() (+3 more)

### Community 86 - "Community 86"
Cohesion: 0.48
Nodes (6): CITY_COORDS, cityLookupKey(), hashString(), jitterAroundCentroid(), resolveCityCoordinates(), STATE_CENTROIDS

### Community 87 - "Community 87"
Cohesion: 0.06
Nodes (43): POST(), GlobalContainerShareItemListener(), hexToRgb(), MissionCardItem(), phaseHoverShadow(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare() (+35 more)

### Community 88 - "Community 88"
Cohesion: 0.18
Nodes (11): MobilizeDialog(), emptyForm(), MobilizeGroupResourcesPanel(), MobilizeResourceRow, MobilizeResourceType, Props, ResourceForm, TYPE_ICONS (+3 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.27
Nodes (11): createPlyrRoot(), EventVideoPlyrDialogInner(), plyrControls, PlyrLike, looksLikeDirectMedia(), pickDailymotionEmbed(), pickVimeoId(), pickYoutubeId() (+3 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.19
Nodes (13): POST(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY, writeAuditLog(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError(), asAuthErrorLike() (+5 more)

### Community 94 - "Community 94"
Cohesion: 0.17
Nodes (20): GET(), loadAutoCloseDays(), loadViewerSettings(), PUT(), requireSuperAdmin(), MobilizeLayout(), MobilizeMemberProfilePage(), Props (+12 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.09
Nodes (34): MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeGroupFeed(), Props, toUnifiedPost(), MobilizeHomeFeedClient() (+26 more)

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (11): MissionRankInfoDialog(), Props, LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience, missionRankDialogTitle(), MissionRankProgress, missionRanksForAudience() (+3 more)

### Community 98 - "Community 98"
Cohesion: 0.21
Nodes (14): ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), authLabelSx, authTextFieldSx, hasSeenHint(), HIGHLIGHT (+6 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.13
Nodes (21): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+13 more)

### Community 100 - "page.tsx"
Cohesion: 0.19
Nodes (18): Ctx, GET(), isApprovedMember(), POST(), GET(), POST(), isValidAnnouncementImagePath(), isValidProfilePostImagePath() (+10 more)

### Community 101 - "Community 101"
Cohesion: 0.05
Nodes (44): capitalizeRole(), EventRow, formatMemberSince(), Group, GROUP_FEED_SUB_TABS, GroupDetailClient(), GroupFeedSubTab, MemberRow (+36 more)

### Community 102 - "Community 102"
Cohesion: 0.17
Nodes (12): AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog(), graduateDisplayName(), OVERLAY_REF, overlayMetrics(), capitalizeRole() (+4 more)

### Community 103 - "Community 103"
Cohesion: 0.32
Nodes (10): Ctx, POST(), getMobilizeResourcesPostAccess(), MobilizeResourcesPostAccess, ALLOWED_MIME, detectResourceDocumentExt(), extFromName(), isPdf() (+2 more)

### Community 104 - "Community 104"
Cohesion: 0.13
Nodes (32): GET(), isIsoDate(), POST(), PostBody, chaptersForStateFilter(), chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed() (+24 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.09
Nodes (32): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+24 more)

### Community 106 - "Community 106"
Cohesion: 0.09
Nodes (23): MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, CommentItem(), countComments() (+15 more)

### Community 107 - "Community 107"
Cohesion: 0.50
Nodes (3): extends, next/core-web-vitals, next/typescript

### Community 108 - "Community 108"
Cohesion: 0.10
Nodes (25): AdminTab, CertificateRequestsAdminClient(), DetailRequest, formatAddress(), formatDateTime(), ListRow, Props, RequestStatus (+17 more)

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): contentType(), GET(), UPLOADS_ROOT

### Community 110 - "Community 110"
Cohesion: 0.16
Nodes (15): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+7 more)

### Community 111 - "CourseGraduateBadge.tsx"
Cohesion: 0.29
Nodes (7): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), useSyncedState()

### Community 112 - "registry.ts"
Cohesion: 0.29
Nodes (11): countInviteShareMetrics(), countMobilizeChapterGroups(), countStartedMissions(), countUpcomingGatherings(), loadOverviewStats(), loadStatePopupStats(), normalizeStateCode(), OverviewScope (+3 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.13
Nodes (19): PasswordTextField(), ChangePasswordDialog(), NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringStatus, accept (+11 more)

### Community 115 - "Community 115"
Cohesion: 0.18
Nodes (10): JourneyWelcomeDialog(), Props, RICH_CONTENT_SX, BriefingVideoAdmin(), BRIEFING_WELCOME, MissionBriefingLanding(), Props, MissionBriefingPlayer() (+2 more)

### Community 116 - "route.ts"
Cohesion: 0.17
Nodes (6): AdminRolesPage(), BroadcastHistoryPage(), CommunityPage(), CourseProgressPage(), LogsPage(), DataPaneFallback()

### Community 117 - "Community 117"
Cohesion: 0.24
Nodes (11): POST(), ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience(), normalizeBroadcastAudience(), normalizeOptionalScopeId(), resolveBroadcastRecipients() (+3 more)

### Community 119 - "parse-upload.ts"
Cohesion: 0.29
Nodes (10): Body, POST(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity(), loadUserDisplay(), capitalizePersonName(), capitalizePrivacyHandlesInText() (+2 more)

### Community 120 - "EditCoursePageContent.tsx"
Cohesion: 0.36
Nodes (5): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo

### Community 121 - "Community 121"
Cohesion: 0.32
Nodes (9): DashboardLayout(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsProvider(), DashboardUser, loadDashboardUser(), loadTrainingGraduateBadge() (+1 more)

### Community 123 - "page.tsx"
Cohesion: 0.33
Nodes (9): GET(), PATCH(), GET(), enrichPersonNames(), getPersonProfileNoteById(), loadPersonNotesAdminList(), personDisplayName(), searchPersonUserIds() (+1 more)

### Community 124 - "Community 124"
Cohesion: 0.62
Nodes (4): POST(), RouteCtx, rowToCampaign(), requireBroadcastSend()

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "Community 128"
Cohesion: 0.25
Nodes (13): DashboardTourActions, prepareSidebarTarget(), scrollTourTargetIntoView(), tourAttr(), buildMainDashboardTourEntries(), highlightHook(), MODULE_COPY, moduleCopyForProfile() (+5 more)

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "page.tsx"
Cohesion: 0.48
Nodes (6): sendBroadcastEmail(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 131 - "Community 131"
Cohesion: 0.60
Nodes (4): GET(), POST(), stripHtml(), BROADCAST_CHANNELS

### Community 132 - "training-feed.ts"
Cohesion: 0.17
Nodes (16): GET(), GET(), GET(), POST(), buildConversationSummaries(), canSendDirectMessage(), loadDirectMessageThread(), loadMobilizeDirectMessages() (+8 more)

### Community 133 - "Community 133"
Cohesion: 0.23
Nodes (11): AnnouncementsNavBadge(), MissionUpdatesNavIcon(), MissionUpdatesUnreadContext, MissionUpdatesUnreadContextValue, MissionUpdatesUnreadProvider(), useMissionUpdatesUnread(), NotificationsDrawerUnreadCount(), getAudioContext() (+3 more)

### Community 134 - "Community 134"
Cohesion: 0.40
Nodes (5): ManualLogForm(), AuditRow, formatAuditDetails(), LogSortKey, LogsTable()

### Community 135 - "Community 135"
Cohesion: 0.40
Nodes (5): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), PeopleOverviewStats

### Community 138 - "nprogress"
Cohesion: 0.07
Nodes (57): Ctx, isApprovedMember(), POST(), buildCommentTree(), CommentNode, CommentRow, Ctx, GET() (+49 more)

### Community 140 - "Community 140"
Cohesion: 0.10
Nodes (35): formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer(), ImageCropDialog(), ImageCropKind (+27 more)

### Community 141 - "Community 141"
Cohesion: 0.36
Nodes (11): displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle(), resolveCourseFinishedDisplay() (+3 more)

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 146 - "page.tsx"
Cohesion: 0.27
Nodes (9): areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), hasAutoTourCompleted(), markAutoTourCompleted(), markTourStepIdsSeen(), markTourStepSeen(), readRaw() (+1 more)

### Community 148 - "Community 148"
Cohesion: 0.09
Nodes (56): AK, lat, lng, AL, lat, lng, AR, lat (+48 more)

### Community 149 - "Community 149"
Cohesion: 0.17
Nodes (5): ChaptersPage(), BroadcastTemplatesPage(), EditCoursePage(), NewGatheringPage(), LeadersPage()

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "Community 152"
Cohesion: 0.20
Nodes (12): ResetPasswordPage(), ChapterOption, RegisterPage(), MaintenancePage(), metadata, ArmyAuthShell(), authFloatingTextFieldSx, AuthFormBrandHeader() (+4 more)

### Community 162 - "isNavModuleAllowedForRoles"
Cohesion: 0.14
Nodes (28): PATCH(), PatchBody, STATUSES, GET(), parseFilter(), CommunityPageContent(), LeadersPageContent(), NotificationsPageContent() (+20 more)

### Community 168 - "parse-upload.ts"
Cohesion: 0.40
Nodes (4): NESTED_NAV_TOUCH_SX, Props, SidebarNestedNavItem, SidebarNestedNavList()

### Community 169 - "UserNotesAdminClient.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 172 - "Community 172"
Cohesion: 0.13
Nodes (30): canManageEvents(), Ctx, GET(), isApprovedMember(), POST(), Ctx, GET(), normalizeStateCode() (+22 more)

### Community 188 - "route.ts"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

## Knowledge Gaps
- **702 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+697 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **83 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `Community 43` to `Community 1`, `Community 2`, `Community 131`, `Community 3`, `Community 6`, `Community 8`, `Community 11`, `Community 13`, `Community 16`, `Community 22`, `Community 23`, `Community 29`, `Community 33`, `isNavModuleAllowedForRoles`, `Community 40`, `Community 172`, `Community 45`, `Community 46`, `Community 47`, `Community 51`, `Community 58`, `route.ts`, `Community 62`, `Community 64`, `Community 65`, `Community 82`, `Community 85`, `Community 104`, `getMailTransportAndFrom`, `Community 117`, `parse-upload.ts`, `Community 121`, `page.tsx`, `Community 124`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Community 31` to `Community 9`, `UserProfileDrawer.tsx`, `Community 13`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 144`, `Community 147`, `Community 153`, `Community 154`, `Community 28`, `Community 31`, `react-easy-crop`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `Community 95`, `@mui/material-nextjs`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _702 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14716312056737588 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08871287128712871 - nodes in this community are weakly interconnected._
- **Should `Community 8` be split into smaller, more focused modules?**
  _Cohesion score 0.07656341320864991 - nodes in this community are weakly interconnected._