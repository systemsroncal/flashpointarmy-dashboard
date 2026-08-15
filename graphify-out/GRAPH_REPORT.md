# Graph Report - dashboard  (2026-08-14)

## Corpus Check
- 836 files · ~408,420 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3796 nodes · 12746 edges · 227 communities (143 shown, 84 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8a743947`
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
- user-directory-export.ts
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

## Communities (227 total, 84 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (32): PATCH(), GET(), GET(), isCommunicationsAdmin(), POST(), announcementPlainTextPreview(), AnnouncementTargetUsersField(), UserOption (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (32): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (90): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+82 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (46): fetchPresenceRowsInRange(), GET(), PresenceRow, barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo (+38 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (31): MobilizeCollapsiblePostBody(), Props, ConnectionKind, ConnectionUser, MobilizeConnectionsDialog(), RecommendedUserRow(), COMMENT_EMOJI_OPTIONS, CommentComposer() (+23 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (11): ADMIN_ROLES, ALL_ADMIN_ROLES, isPureMember(), matchesAudience(), normalizeBroadcastAudience(), normalizeOptionalScopeId(), resolveBroadcastRecipients(), STAFF_ROLES (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (24): AddMemberSearchableUser, MobilizeAddMemberDialog(), parseCommaSeparatedEmails(), primaryRoleLabel(), userInitials(), formatDate(), logColor(), MobilizeAutoFollowAddDialog() (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.31
Nodes (8): PATCH(), PatchBody, STATUSES, PATCH(), PatchBody, STATUSES, addMinutesIso(), unlockFirstMissionAfterCoachMeetingCompleted()

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (36): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (45): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+37 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (63): DashboardWelcome(), MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeGroupFeed(), Props, toUnifiedPost() (+55 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (29): Ctx, GET(), primaryRoleLabel(), ensureMobilizeGroupManager(), GET(), sanitizeIlikeTerm(), SearchableUser, searchDashboardUsersFromDb() (+21 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.24
Nodes (17): GET(), parseRoleFilter(), GET(), GET(), GET(), buildCourseProgressExportRows(), CourseProgressExportRoleFilter, buildUserDirectoryExportRows() (+9 more)

### Community 15 - "Community 15"
Cohesion: 0.24
Nodes (15): RFC-5322, decryptDeliverySecrets(), DeliverySettingsPatch, EmailDeliveryProvider, EmailDeliveryRow, loadEncryptionPassphrase(), decryptEmailSecret(), deriveKeyFromPassphrase() (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (42): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+34 more)

### Community 17 - "Community 17"
Cohesion: 0.35
Nodes (7): ChapterOption, RegisterPage(), authFloatingTextFieldSx, SignInEmailChangePanel(), SignInEmailChangePanelProps, formatOtpResendCountdown(), useOtpResendCooldown()

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (30): capitalizeRole(), GroupMemberPreviewRow, MobilizeGroupMembersPreview(), Props, MOBILIZE_GROUP_TAB_ICONS, MOBILIZE_GROUP_TAB_NAV_SX, MobilizeGroupSidebarTabs(), NAV_ITEM_TOUCH_SX (+22 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (23): GET(), JoinReq, MobilizeNotificationsPage(), MobilizeChapterUpdatesPanel(), Props, MobilizeGroupCustomNotifications(), EventNotificationCard(), JoinRequestCard() (+15 more)

### Community 22 - "Community 22"
Cohesion: 0.11
Nodes (39): POST(), GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), PATCH(), RouteCtx (+31 more)

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
Cohesion: 0.11
Nodes (32): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows() (+24 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (14): CourseSessionPage(), CourseQuizBlock(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.17
Nodes (14): config, middleware(), POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired() (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.12
Nodes (15): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (21): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+13 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (18): xlsx, buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds() (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (7): MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, mobilizeGroupFeedContentFillSx

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (12): POST(), writeAuditLog(), normalizeAuthEmail(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError(), asAuthErrorLike(), clearStaleAuthSession() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (13): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+5 more)

### Community 35 - "Community 35"
Cohesion: 0.08
Nodes (63): PATCH(), POST(), DELETE(), DELETE(), GET(), DELETE(), DELETE(), GET() (+55 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (20): executeBroadcastCampaign(), SendCampaignResult, isEmailProviderConfigured(), sendBroadcastSms(), Branding, BroadcastShortcodes, renderBroadcastEmail(), renderBroadcastSms() (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (13): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker, AnnouncementDescriptionBody(), darkHtmlSx (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (20): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+12 more)

### Community 40 - "Community 40"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.09
Nodes (29): Cell, InviteBody, POST(), POST(), ALLOWED_KEYS, PATCH(), PatchBody, STATUSES (+21 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.08
Nodes (50): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), Body (+42 more)

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (16): GET(), PUT(), PutBody, GET(), parseFirstMissionStatus(), PatchBody, STATUSES, displayNameFromUser() (+8 more)

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (16): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+8 more)

### Community 46 - "Community 46"
Cohesion: 0.07
Nodes (39): GET(), PUT(), Editor, EMOJI_CONFIG, GatheringDescriptionEditor(), Props, feedAdImageSx, MobilizeFeedAdsCarousel() (+31 more)

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (15): formatAddress(), formatBirthday(), formatGender(), formatRole(), formatState(), NAV, panelSx, PersonProfileClient() (+7 more)

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
Cohesion: 0.12
Nodes (29): GET(), PATCH(), GET(), GET(), GET(), GET(), GET(), POST() (+21 more)

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (16): ChapterSearchAutocomplete(), ChapterSearchAutocompleteProps, ALL_CHAPTER_OPTION, ALL_STATE_OPTION, AllChapterOption, chapterFilterLabel(), ChapterFilterOption, isAllChapterOption() (+8 more)

### Community 53 - "Community 53"
Cohesion: 0.11
Nodes (29): canManageGroupMembers(), Ctx, DELETE(), PATCH(), Ctx, GET(), normalizeStateCode(), POST() (+21 more)

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): buildDraft(), CellKey, LABELS, Mod, Role, RolesAdmin(), RP

### Community 55 - "Community 55"
Cohesion: 0.23
Nodes (9): Ctx, POST(), Props, PublicMobilizeGroupPage(), PublicGroupProfileView(), applyMobilizeAutoCloseInactive(), enrollmentAutoApproves(), JoinGroupMembershipResult (+1 more)

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
Cohesion: 0.13
Nodes (23): DashboardLayout(), MissionBriefingPageInner(), MissionBriefingPage(), CommandCenterBackdrop(), DashboardUserContext, DashboardUserProvider(), PermissionsContext, PermissionsProvider() (+15 more)

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (37): MobilizeLayout(), cards, MobilizeHomePage(), CHAPTERS_ICONS, MobilizeBottomNav(), MobilizeChaptersBottomNav(), MobilizeSocialBottomNav(), Props (+29 more)

### Community 61 - "Community 61"
Cohesion: 0.10
Nodes (28): baseOpts, Chart, CourseCompletionComparison(), Props, CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props (+20 more)

### Community 62 - "Community 62"
Cohesion: 0.19
Nodes (18): GET(), DashboardHomeContent(), baseOpts, Chart, PeopleOverviewClient(), relativeTime(), includeReferenceInOverviewStatTotals(), aggregateReferenceLeaderMemberByState() (+10 more)

### Community 63 - "Community 63"
Cohesion: 0.16
Nodes (17): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+9 more)

### Community 64 - "Community 64"
Cohesion: 0.48
Nodes (9): GET(), GET(), getAppBaseUrl(), getGmailOAuthRedirectUri(), fetchEmailDeliverySettings(), saveGmailOAuthResult(), createGmailOAuthState(), stateSecret() (+1 more)

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (21): countUsersRegistered(), GET(), Chart, chartBase, ComparisonPayload, ReportsRegistrationComparison(), daysInclusive(), defaultWeekComparisonRanges() (+13 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.19
Nodes (20): GET(), loadAutoCloseDays(), loadViewerSettings(), PUT(), requireSuperAdmin(), resolveViewerUserOptions(), MobilizeMemberProfilePage(), Props (+12 more)

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.24
Nodes (15): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, blockTitleHtmlFromPlain(), blockTitlePlainFromHtml(), collectCourseBlockValidationIssues() (+7 more)

### Community 76 - "Community 76"
Cohesion: 0.24
Nodes (15): displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle(), resolveCourseFinishedDisplay() (+7 more)

### Community 82 - "Community 82"
Cohesion: 0.30
Nodes (10): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, inviteShareChannelLabel(), isInviteShareChannel() (+2 more)

### Community 84 - "Community 84"
Cohesion: 0.20
Nodes (15): CommunityInActionFeed(), CommunityActivityFeedRow, HIDDEN_COMMUNITY_FEED_CATEGORIES, isHiddenCommunityFeedRow(), loadCommunityActivityFeed(), mapFeedRows(), COMMUNITY_CATS, COMMUNITY_FEED_TIER_LABELS (+7 more)

### Community 85 - "Community 85"
Cohesion: 0.37
Nodes (11): GET(), isBucket(), fetchAllCourseSessionProgress(), bucketKeyForDate(), buildSeriesForTimestamps(), DateBucket, enumerateBucketLabels(), pad2() (+3 more)

### Community 86 - "Community 86"
Cohesion: 0.26
Nodes (10): MissionRankInfoDialog(), Props, LEADER_MISSION_RANKS, MEMBER_MISSION_RANKS, MissionRankAudience, missionRankDialogTitle(), MissionRankProgress, missionRanksForAudience() (+2 more)

### Community 87 - "Community 87"
Cohesion: 0.15
Nodes (23): GET(), parseCoachMeetingStatus(), CoachMeetingStepStatus, resolveCoachMeetingStepStatus(), ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex() (+15 more)

### Community 88 - "Community 88"
Cohesion: 0.03
Nodes (79): capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow, Membership, MessageRow (+71 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 90 - "Community 90"
Cohesion: 0.36
Nodes (7): DEFAULT_TARGET_EMAILS, __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveUserId(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.23
Nodes (17): PeoplePage(), PeoplePageContent(), isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES, MEMBER_NAV_MODULES (+9 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.22
Nodes (14): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, buildHalfHourSlots(), CoachMeetingBookingRecord (+6 more)

### Community 94 - "Community 94"
Cohesion: 0.14
Nodes (21): displayNameForUser(), POST(), ALLOWED, DEMO_SHORTCODES, POST(), PATCH(), PatchBody, PATCH() (+13 more)

### Community 95 - "Community 95"
Cohesion: 0.27
Nodes (11): MobilizeChapterFeedBanner(), Props, US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), MobilizeGroupStateInfo, resolveMobilizeGroupStateCode(), resolveMobilizeGroupStateInfo(), usStateFlagSrc() (+3 more)

### Community 96 - "Community 96"
Cohesion: 0.07
Nodes (56): Ctx, isApprovedMember(), POST(), Ctx, loadMembership(), POST(), DELETE(), GET() (+48 more)

### Community 97 - "Community 97"
Cohesion: 0.24
Nodes (13): POST(), AUTO_CATEGORIES, AutoCategory, countWeeklyMembers(), getZonedParts(), isThursdayNoonInTimeZone(), isWeeklyMembersPostWindow(), lastAutoFeedAt() (+5 more)

### Community 98 - "Community 98"
Cohesion: 0.16
Nodes (19): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), MaintenancePage(), metadata, ArmyAuthShell() (+11 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.13
Nodes (21): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+13 more)

### Community 100 - "page.tsx"
Cohesion: 0.22
Nodes (13): Ctx, DELETE(), PATCH(), Ctx, GET(), loadMembership(), POST(), POST() (+5 more)

### Community 101 - "journey-feed.ts"
Cohesion: 0.53
Nodes (5): coerceQuizPayload(), CourseQuizFormEditor(), newQuestion(), normalizeQuestion(), QuizQuestion

### Community 102 - "Community 102"
Cohesion: 0.13
Nodes (15): AlertAvatar(), formatAlertTime(), KIND_BADGE, UserNotificationsClient(), readLastSeen(), UserNotificationsMenu(), ConversationListItem(), formatMessageTime() (+7 more)

### Community 103 - "Community 103"
Cohesion: 0.21
Nodes (16): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+8 more)

### Community 104 - "Community 104"
Cohesion: 0.14
Nodes (31): GET(), isIsoDate(), POST(), PostBody, listProfilesByIds(), profileRowsWithMailingDefaults(), chaptersForStateFilter(), chapterStateFromProfile() (+23 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.08
Nodes (37): Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE(), GET(), PATCH() (+29 more)

### Community 106 - "Community 106"
Cohesion: 0.22
Nodes (8): AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog(), graduateDisplayName(), OVERLAY_REF, overlayMetrics(), TrainingGraduateBadgeRole

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
Cohesion: 0.20
Nodes (14): chunkIds(), NotificationMenu(), NotificationRow, MobilizeNavNotificationsBadge(), EMPTY, notificationKeys(), useMobilizeNotifications(), getNotificationSoundEnabled() (+6 more)

### Community 111 - "ReportsCityHeatmapMap.tsx"
Cohesion: 0.44
Nodes (5): POST(), POST(), createRawToken(), hashActionToken(), resolveAuthUserByEmail()

### Community 112 - "registry.ts"
Cohesion: 0.21
Nodes (18): GET(), POST(), GET(), GET(), GET(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic() (+10 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.17
Nodes (15): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringStatus, SupabaseStaleSessionCleanup(), countPresenceUsers(), DashboardPresenceContext (+7 more)

### Community 115 - "certificate-requests.ts"
Cohesion: 0.14
Nodes (14): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+6 more)

### Community 116 - "route.ts"
Cohesion: 0.17
Nodes (6): AdminRolesPage(), ChaptersPage(), GatheringsPage(), LeadersPage(), LogsPage(), DataPaneFallback()

### Community 117 - "Community 117"
Cohesion: 0.29
Nodes (6): assignmentSteps, checklist, IntroVideoAdminProps, Props, TrainingCommandLanding(), TrainingIntroVideoAdmin()

### Community 118 - "MobilizeBottomNavBar.tsx"
Cohesion: 0.28
Nodes (7): LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY, ManualLogForm(), AuditRow, formatAuditDetails(), LogSortKey, LogsTable()

### Community 119 - "parse-upload.ts"
Cohesion: 0.05
Nodes (44): GlobalContainerShareItemListener(), hexToRgb(), MissionCardItem(), phaseHoverShadow(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props (+36 more)

### Community 120 - "MissionBriefingPageContent.tsx"
Cohesion: 0.71
Nodes (5): GET(), PATCH(), requireSuperAdmin(), upsertEmailDeliverySettings(), hasGmailOAuthClientSecretInEnv()

### Community 121 - "Community 121"
Cohesion: 0.23
Nodes (11): AnnouncementsNavBadge(), MissionUpdatesNavIcon(), MissionUpdatesUnreadContext, MissionUpdatesUnreadContextValue, MissionUpdatesUnreadProvider(), useMissionUpdatesUnread(), NotificationsDrawerUnreadCount(), getAudioContext() (+3 more)

### Community 122 - "page.tsx"
Cohesion: 0.38
Nodes (5): POST(), consumeRateLimit(), hitsByKey, AutoFollowSyncEvent, syncMobilizeAutoFollow()

### Community 123 - "page.tsx"
Cohesion: 0.39
Nodes (6): GET(), AvailableProviders, envSet(), isTwilioSmsConfigured(), listAvailableProviders(), EmailProvider

### Community 124 - "Community 124"
Cohesion: 0.14
Nodes (20): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+12 more)

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "parse-upload.ts"
Cohesion: 0.12
Nodes (23): GET(), GET(), GET(), GET(), POST(), GET(), GET(), GroupRow (+15 more)

### Community 129 - "Community 129"
Cohesion: 0.44
Nodes (6): Body, POST(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity(), loadUserDisplay()

### Community 130 - "page.tsx"
Cohesion: 0.21
Nodes (19): ProgressPageContent(), progressRoleLabel(), graduateBadgeRoleFromRoles(), isUserCourseComplete(), loadCountableCourseSessionIds(), loadCourseSessionIds(), loadTrainingGraduateBadge(), loadTrainingGraduateBadgesForUsers() (+11 more)

### Community 131 - "us-city-coordinates.ts"
Cohesion: 0.13
Nodes (21): ActivityFeedRow, ChapterRow, drawerLikeScrollbarSx, formatStatCompact(), NationalOverview(), UsaChapterActivityMap, isMemberOrLeader(), isChapterMapInviteCtaEnabled() (+13 more)

### Community 133 - "PeopleOverviewClient.tsx"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 136 - "dashboard-tour-steps.ts"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 137 - "usStateByCode"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 138 - "enrichMobilizeGroupsBrowse"
Cohesion: 0.07
Nodes (39): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), MyGroupsPage(), MobilizeContentPanel(), Props (+31 more)

### Community 140 - "Community 140"
Cohesion: 0.12
Nodes (27): ChangePasswordDialog(), formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer(), ImageCropDialog() (+19 more)

### Community 141 - "InviteFriendsBanner.tsx"
Cohesion: 0.48
Nodes (6): sendBroadcastEmail(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 143 - "dashboard-tour-storage.ts"
Cohesion: 0.27
Nodes (9): areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), hasAutoTourCompleted(), markAutoTourCompleted(), markTourStepIdsSeen(), markTourStepSeen(), readRaw() (+1 more)

### Community 144 - "ReportsChartsClient.tsx"
Cohesion: 0.60
Nodes (3): MissionBriefingPlayer(), Props, isVideoEligibleForMarkComplete()

### Community 145 - "Community 145"
Cohesion: 0.31
Nodes (9): columnExists(), __dirname, findExistingStateChapter(), loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveOwnerId(), ROOT (+1 more)

### Community 146 - "overview-stats.ts"
Cohesion: 0.19
Nodes (15): POST(), correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect() (+7 more)

### Community 147 - "FirstLoginPasswordGate.tsx"
Cohesion: 0.43
Nodes (5): GET(), extractTopicsFromText(), HubTopic, loadMobilizeHubSidebar(), SuggestedGroupRow

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
Nodes (5): CourseProgressPage(), EditGatheringPage(), ChapertsPage(), FirstMissionsPage(), TrainingPage()

### Community 157 - "page.tsx"
Cohesion: 0.29
Nodes (7): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), useSyncedState()

### Community 159 - "page.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 181 - "@fortawesome/fontawesome-svg-core"
Cohesion: 0.70
Nodes (4): GET(), parseFilter(), parseJourneyProgressSortAscending(), parseJourneyProgressSortKey()

### Community 184 - "route.ts"
Cohesion: 0.09
Nodes (39): Ctx, DELETE(), loadMembership(), Ctx, DELETE(), loadMembership(), PATCH(), Ctx (+31 more)

### Community 203 - "dashboard-tour-actions.ts"
Cohesion: 0.20
Nodes (16): DashboardTourActions, prepareSidebarTarget(), scrollTourTargetIntoView(), tourAttr(), buildMainDashboardTourEntries(), DashboardTourBuildInput, filterEntriesWithDom(), filterUnseenEntries() (+8 more)

### Community 204 - "SidebarNestedNavList.tsx"
Cohesion: 0.40
Nodes (4): NESTED_NAV_TOUCH_SX, Props, SidebarNestedNavItem, SidebarNestedNavList()

## Knowledge Gaps
- **735 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+730 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **84 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `Community 43` to `Community 0`, `Community 1`, `Community 2`, `Community 129`, `Community 3`, `page.tsx`, `parse-upload.ts`, `Community 7`, `Community 8`, `usStateByCode`, `Community 10`, `Community 12`, `Community 14`, `Community 15`, `Community 16`, `Community 22`, `Community 23`, `Community 35`, `Community 41`, `Community 44`, `Community 51`, `@fortawesome/fontawesome-svg-core`, `Community 55`, `Community 59`, `Community 62`, `Community 64`, `Community 65`, `Community 85`, `Community 87`, `Community 91`, `Community 94`, `Community 97`, `Community 104`, `getMailTransportAndFrom`, `ReportsCityHeatmapMap.tsx`, `MissionBriefingPageContent.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Community 31` to `Community 9`, `UserProfileDrawer.tsx`, `Community 14`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `dashboard-tour-steps.ts`, `Community 13`, `Community 142`, `Community 153`, `Community 154`, `Community 31`, `user-directory-export.ts`, `@dnd-kit/core`, `eslint-config-next`, `isomorphic-dompurify`, `plyr`, `react-easy-crop`, `react-leaflet`, `react-simple-maps`, `@tinymce/tinymce-react`, `Community 201`, `Community 202`, `Community 206`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `@mui/material-nextjs`, `next`, `nodemailer`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _735 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12624584717607973 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12917271407837447 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07995495495495496 - nodes in this community are weakly interconnected._