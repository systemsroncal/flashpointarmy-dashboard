# Graph Report - dashboard  (2026-08-11)

## Corpus Check
- 794 files · ~380,191 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3616 nodes · 12187 edges · 201 communities (138 shown, 63 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c57b8cde`
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
- training-feed.ts
- PeopleOverviewClient.tsx
- normalizeAnnouncementPdfUrl
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
- Community 156
- Community 158
- Community 160
- GatheringDescriptionEditor.tsx
- isNavModuleAllowedForRoles
- ChapterInviteShareDialog.tsx
- page.tsx
- UserNotesAdminClient.tsx
- page.tsx
- page.tsx
- page.tsx
- react-easy-crop
- page.tsx
- CourseIntroVideoBlock.tsx
- route.ts
- page.tsx
- Community 201
- Community 202
- Community 206
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
- `writeWorkbook()` --references--> `xlsx`  [EXTRACTED]
  scripts/export-members-leaders-xlsx.mjs → package.json
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

## Communities (201 total, 63 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.18
Nodes (15): BroadcastHistoryClient(), statusColor(), BroadcastSendClient(), ProviderInfo, Snack, BroadcastTemplatesClient(), Snack, AUDIENCE_LABELS (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (25): POST(), RegisterPayload, POST(), POST(), POST(), POST(), POST(), POST() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (82): DEFAULT_FORM_IDS, escapeRegex(), extractEntries(), fetchFormEntriesByDate(), FluentEntry, fluentFormSyncAuthHeaders(), FluentSyncSummary, isStatementTimeoutError() (+74 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (17): fetchPresenceRowsInRange(), GET(), PresenceRow, cityDisplayLabel(), normalizeUserCityForReports(), normalizeUserStateForReports(), stateDisplayNameForReports(), PresenceCityDemographicRow (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (48): Body, POST(), DELETE(), isCommunicationsAdmin(), POST(), GET(), Ctx, GET() (+40 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (20): loadCountableCourseSessionIds(), ADMIN_ROLE_NAMES, CoachMeetingRecord, displayNameFromUser(), filterBaseIndex(), FirstMissionRecord, listOnboardingMemberUserIds(), loadCoachMeetingStatusIndex() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (38): GET(), parseCoachMeetingStatus(), PATCH(), PatchBody, STATUSES, PATCH(), PatchBody, STATUSES (+30 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (22): isChaptersNavHiddenForRoles(), isLocalLeaderNonElevated(), isNavModuleAllowedForRoles(), isRestrictedMemberNav(), LOCAL_LEADER_HIDDEN_MODULES, MEMBER_NAV_MODULES, SUB_ADMIN_NAV_MODULES, isSubAdminUser() (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (43): appBaseUrl(), POST(), POST(), cardHoverSx(), cardPalette(), DonatePageClient(), packageTitle(), packageUrl() (+35 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (38): apexcharts, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, driver.js, @emotion/cache, @emotion/react, @emotion/styled (+30 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (17): SendCampaignResult, Branding, BroadcastShortcodes, renderBroadcastEmail(), renderBroadcastSms(), replaceShortcodes(), displayNameForRecipient(), shortcodesForRecipient() (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (15): DeliverySummary, EmailDeliverySettingsPanel(), Branding, BRANDING_DEFAULTS, EmailLogSortKey, EmailSendLogRow, EmailsSettingsClient(), initialTabIndex() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.34
Nodes (14): DELETE(), isCommunicationsAdmin(), PATCH(), PATCH(), GET(), isCommunicationsAdmin(), POST(), normalizeAnnouncementPdfFileName() (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (21): DashboardLayout(), MissionsPage(), CommandCenterBackdrop(), MissionsLanding(), DashboardUserProvider(), PermissionsContext, PermissionsProvider(), loadDashboardUser() (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (25): MOBILIZE_GROUP_TAB_ICONS, MOBILIZE_GROUP_TAB_NAV_SX, MobilizeGroupSidebarTabs(), NAV_ITEM_TOUCH_SX, Props, ActiveGroupPayload, GROUP_NAME_ACTIVE_SX, MOBILIZE_DASHBOARD_NAV_ITEM_SX (+17 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (42): isPdf(), POST(), isCommunicationsAdmin(), POST(), POST(), POST(), POST(), Ctx (+34 more)

### Community 17 - "Community 17"
Cohesion: 0.36
Nodes (6): CourseProgressPageClient(), filterByRole(), ProgressRoleFilter, Props, matchesStateChapterFilter(), downloadExcelFromApi()

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (27): @/*, dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (36): MemberOnboardingProgressCard(), Props, statusColor(), StepKey, stepTitleButtonSx(), OnboardingStatusWithInfo(), Props, buildSteps() (+28 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (11): controlsForPlyr(), CourseVideoPlyr(), createPlyrRoot(), plyrControlsBase, PlyrLike, readCurrentTime(), readLs(), setPlayerTime() (+3 more)

### Community 21 - "Community 21"
Cohesion: 0.05
Nodes (61): GET(), GET(), loadAutoCloseDays(), loadViewerSettings(), PUT(), requireSuperAdmin(), MobilizeLayout(), JoinReq (+53 more)

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (11): ReportsPresenceDateRangeControls(), Chart, chartOpts, formatDayLabel(), formatTrend(), rangeLabel(), ReportsPresenceSection(), StatCardProps (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.07
Nodes (68): xlsx, attachTrainingGraduateBadges(), BaseRow, GET(), mergeProfilesAndRoles(), ProfileRow, RoleRelation, GET() (+60 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (27): DashboardShell(), drawerPaperSx(), drawerViewportHeightCss(), isMissionPipelineNavItemSelected(), isMissionPipelinePath(), isNavItemSelected(), MISSION_PIPELINE_HREFS, MISSION_PIPELINE_NAV (+19 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (11): ClusterLayer(), escapeHtml(), FitSearchRadiusView(), fixDefaultIcons(), MapMarkerPoint, MapSearchOrigin, personDivIcon(), Props (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (22): applyTextSearch(), BaseJourneyRow, canUseSqlPagination(), compareJourneyProgressRows(), DashboardUserRow, displayName(), enrichJourneyRows(), fetchAllDashboardUsers() (+14 more)

### Community 27 - "Community 27"
Cohesion: 0.24
Nodes (13): CourseSessionPage(), CourseSessionPlayer(), isVideoEligibleForMarkComplete(), numericVideoPositions(), readVideoDurationsFromPositions(), SessionElementRow, videoDoneStorageKey(), videoDurationStorageKey() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (17): nprogress, nprogress, barlow, konkhmerSleokchher, metadata, RootLayout(), viewport, GlobalPageLoader() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.21
Nodes (15): buildCalendarDays(), CoachMeetingBookingForm(), formatDisplayWhen(), isPastDate(), MeetingRecord, Props, addMinutesIso(), buildHalfHourSlots() (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (17): EditEmailTemplatePage(), Props, Props, NewEmailTemplatePage(), EditSmsTemplatePage(), Props, Props, NewSmsTemplatePage() (+9 more)

### Community 31 - "Community 31"
Cohesion: 0.23
Nodes (16): buildExportRow(), chunkArray(), collectUserIdsForRole(), countRoleAssignments(), __dirname, fetchChapterMap(), fetchProfilesByIds(), fetchRoleNamesByUserIds() (+8 more)

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (17): Ctx, POST(), Props, PublicMobilizeGroupPage(), EventRow(), formatEventShort(), PublicGroupEvent, PublicGroupProfileData (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.23
Nodes (13): findAllVideoMarkers(), findLegacyDivMarkers(), findRegexMarkers(), mergeNonOverlapping(), normalizeCapturedUrl(), VideoMarker, AnnouncementDescriptionBody(), darkHtmlSx (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, supabase, @types/leaflet, @types/leaflet.markercluster, @types/node, @types/nodemailer, @types/nprogress (+29 more)

### Community 35 - "Community 35"
Cohesion: 0.36
Nodes (5): POST(), normalizeAuthEmail(), isInvalidLoginCredentialsError(), signInPasswordCandidates(), formatAuthSignInError()

### Community 36 - "Community 36"
Cohesion: 0.33
Nodes (14): GET(), POST(), GET(), CoachMeetingKind, coachMeetingKindForAudience(), coachMeetingTopic(), MissionRankAudience, loadCoachMeetingForUser() (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.16
Nodes (18): config, middleware(), POST(), POST(), Home(), getServerAuth(), clearSessionStartedCookie(), isAppSessionExpired() (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (13): scripts, build, clean, dev, dev:debug, dev:reset, dev:turbo, dev:webpack (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.19
Nodes (18): addRoleMenuOptions(), buildUserSearchBlob(), ChapterOption, clampEditableRole(), communityPrimaryRole(), CommunitySection(), CommunitySortKey, CommunityUserRow (+10 more)

### Community 40 - "Community 40"
Cohesion: 0.19
Nodes (13): POST(), GET(), GET(), Body, PATCH(), chapterStateFromProfile(), displayHandle(), insertJourneyActivity() (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (25): createDriverInstance(), DashboardTourContext, DashboardTourContextValue, DashboardTourHelpButton(), DashboardTourProvider(), DashboardTourProviderProps, loadDriver(), noopOverlayClick() (+17 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): POST(), formatPhotonLine(), geocodeForward(), GeocodeHit, geocodeNominatim(), geocodePhoton(), nominatimUserAgent(), PhotonFeature

### Community 43 - "Community 43"
Cohesion: 0.06
Nodes (61): GET(), loadExcludedAdminUserIds(), POST(), PostBody, Body, POST(), POST(), POST() (+53 more)

### Community 44 - "Community 44"
Cohesion: 0.10
Nodes (29): GET(), PUT(), AdBlockThumbnail(), blockLabel(), blockPreviewImageUrl(), MobilizeFeedAdsSettingsForm(), CREATOR_ROLE_OPTIONS, MobilizePolicySettingsForm() (+21 more)

### Community 45 - "Community 45"
Cohesion: 0.07
Nodes (41): formatEventDateTime(), GatheringDetailContent(), formatEventDateTime(), PublicEventsPage(), formatEventDateTime(), PublicEventPage(), CourseGridClient(), SESSION_CARD_TOUCH_SX (+33 more)

### Community 46 - "Community 46"
Cohesion: 0.11
Nodes (30): GET(), GET(), GET(), GET(), POST(), parseBackHref(), parseTab(), PersonProfilePageContent() (+22 more)

### Community 47 - "Community 47"
Cohesion: 0.13
Nodes (21): announcementPlainTextPreview(), AnnouncementTargetUsersField(), UserOption, InlinePdfPreview(), Props, proxyPdfPath(), emptyCta(), fromLocalDatetimeValue() (+13 more)

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
Cohesion: 0.33
Nodes (7): AnnouncementsNavBadge(), MissionUpdatesNavIcon(), MissionUpdatesUnreadContext, MissionUpdatesUnreadContextValue, MissionUpdatesUnreadProvider(), useMissionUpdatesUnread(), NotificationsDrawerUnreadCount()

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
Cohesion: 0.35
Nodes (7): areAllTourStepsSeen(), clearSeenTourStepIds(), getSeenTourStepIds(), markTourStepIdsSeen(), markTourStepSeen(), readRaw(), storageKey()

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
Cohesion: 0.33
Nodes (7): barColorForPercent(), COLORS, geographyToStateCode(), HEAT_STOPS, heatFill(), ReportsStateDemographicMap(), RsmGeo

### Community 60 - "Community 60"
Cohesion: 0.07
Nodes (38): cards, MobilizeHomePage(), DashboardWelcome(), HeaderSuperAdminProfileAvatar(), SOCIAL_MENU_ICONS, CHAPTERS_ICONS, MobilizeBottomNav(), MobilizeChaptersBottomNav() (+30 more)

### Community 61 - "Community 61"
Cohesion: 0.30
Nodes (9): GET(), GET(), GroupRow, emptyExtras(), enrichMobilizeGroupsBrowse(), fullNameFromRow(), boundingBoxForRadiusKm(), deg2rad() (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.27
Nodes (14): GET(), DashboardHomeContent(), listAllDashboardUsers(), includeReferenceInOverviewStatTotals(), aggregateReferenceLeaderMemberByState(), CitiesDonorsJson, ReferenceStateSplit, sumReferenceTotals() (+6 more)

### Community 63 - "Community 63"
Cohesion: 0.16
Nodes (17): CoachMeetingData, CoachMeetingsAdminClient(), Props, Row, FirstMissionData, Props, Row, formatCoachMeetingWhen() (+9 more)

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (32): RFC-5322, POST(), POST(), GET(), PATCH(), requireSuperAdmin(), GET(), createRawToken() (+24 more)

### Community 65 - "Community 65"
Cohesion: 0.09
Nodes (36): countUsersRegistered(), GET(), baseOpts, Chart, CourseCompletionComparison(), Props, baseOpts, Bucket (+28 more)

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 67 - "Community 67"
Cohesion: 0.39
Nodes (8): chaptersForStateFilter(), DB_SORTABLE, enrichCertificateRequests(), EnrichedCertificateRequest, listCertificateRequestsAdminPage(), matchesSearch(), resolveChapterUserIds(), sortEnriched()

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (3): NODE_ENV, NODE_OPTIONS, pm2-next-start.sh script

### Community 75 - "Community 75"
Cohesion: 0.15
Nodes (21): ADD_BLOCK_TYPES, CourseEditClient(), DEFAULT_QUIZ_PAYLOAD, ElementRow, SessionRow, coerceQuizPayload(), CourseQuizFormEditor(), newQuestion() (+13 more)

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (16): ActivityFeedRow, displayFeedTitle(), englishCategoryLabel(), FeedRow(), FeedVisual, formatFeedDate(), formatFeedTime(), MemberInviteTitle() (+8 more)

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
Cohesion: 0.09
Nodes (25): AvatarWithGraduateIcon(), BADGE_STYLES, CourseGraduateBadge(), CourseGraduateCongratulationsDialog(), graduateDisplayName(), OVERLAY_REF, overlayMetrics(), capitalizeRole() (+17 more)

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (10): POST(), CHANNEL_THROUGH_LABELS, chapterStateFromProfile(), displayHandle(), insertInviteShareActivity(), INVITE_SHARE_CHANNELS, InviteShareChannel, inviteShareChannelLabel() (+2 more)

### Community 88 - "Community 88"
Cohesion: 0.05
Nodes (55): ActivitiesInner(), endOfMonth(), Ev, MobilizeActivitiesPage(), startOfMonth(), ChapterGroupsClient(), ChapterRow, GroupRow (+47 more)

### Community 89 - "Community 89"
Cohesion: 0.43
Nodes (6): collectTargetUserIds(), __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), ROOT

### Community 90 - "Community 90"
Cohesion: 0.36
Nodes (7): DEFAULT_TARGET_EMAILS, __dirname, loadEnvFile(), loadEnvFromProjectRoot(), main(), resolveUserId(), ROOT

### Community 91 - "Community 91"
Cohesion: 0.06
Nodes (80): Cell, PATCH(), Body, POST(), POST(), POST(), DELETE(), DELETE() (+72 more)

### Community 92 - "Community 92"
Cohesion: 0.22
Nodes (5): admin, byName, json, ref, ROOT

### Community 93 - "Community 93"
Cohesion: 0.12
Nodes (18): Cat, CatSortKey, EventCategoriesClient(), LocationRow, LocationSortKey, LocationsSection(), LOG_TYPE_OPTIONS, MANUAL_ACTION_ICON_KEY (+10 more)

### Community 94 - "Community 94"
Cohesion: 0.17
Nodes (20): DELETE(), getSessionAndPermissions(), PATCH(), PatchBody, PATCH(), PatchBody, GET(), PATCH() (+12 more)

### Community 95 - "Community 95"
Cohesion: 0.33
Nodes (5): engines, node, name, private, version

### Community 96 - "Community 96"
Cohesion: 0.06
Nodes (54): MobilizeSectionEmptyState(), Props, MobilizeAlertsClient(), MobilizeBookmarksClient(), MobilizeCollapsiblePostBody(), Props, MobilizeGroupFeed(), Props (+46 more)

### Community 97 - "Community 97"
Cohesion: 0.68
Nodes (6): formatCentsLabel(), GET(), isValidHttpUrl(), normalizeCardStyle(), PATCH(), POST()

### Community 98 - "Community 98"
Cohesion: 0.12
Nodes (27): ResetPasswordPage(), ForgotPasswordPage(), LoginFallback(), LoginForm(), LoginPage(), ChapterOption, RegisterPage(), MaintenancePage() (+19 more)

### Community 99 - "UserProfileDrawer.tsx"
Cohesion: 0.16
Nodes (15): ChapterRow, ChapterSortKey, ChaptersSection(), leaderEmailsFromJoinedLabels(), LeaderOption, LeadersEmailsCell(), StateSearchAutocomplete(), STATUS_LABEL (+7 more)

### Community 100 - "page.tsx"
Cohesion: 0.13
Nodes (29): Ctx, GET(), normalizeStateCode(), GET(), Ctx, DELETE(), loadMembership(), PATCH() (+21 more)

### Community 101 - "Community 101"
Cohesion: 0.05
Nodes (46): capitalizeRole(), EventRow, formatMemberSince(), Group, GroupDetailClient(), MemberRow, Membership, MessageRow (+38 more)

### Community 102 - "Community 102"
Cohesion: 0.54
Nodes (6): POST(), RouteCtx, rowToCampaign(), requireBroadcastSend(), executeBroadcastCampaign(), BroadcastCampaignRow

### Community 103 - "Community 103"
Cohesion: 0.22
Nodes (15): Ctx, POST(), Ctx, GET(), isApprovedMember(), POST(), RESOURCE_TYPES, getMobilizeResourcesPostAccess() (+7 more)

### Community 104 - "Community 104"
Cohesion: 0.26
Nodes (16): GET(), isIsoDate(), POST(), PostBody, chapterStateFromProfile(), displayHandle(), insertCertificateRequestFeed(), insertCourseCompletedFeed() (+8 more)

### Community 105 - "getMailTransportAndFrom"
Cohesion: 0.07
Nodes (46): GET(), GET(), Ctx, DELETE(), GET(), PATCH(), Ctx, DELETE() (+38 more)

### Community 106 - "Community 106"
Cohesion: 0.11
Nodes (18): GatheringDescriptionEditor(), MobilizeContentTab, MobilizeContentTabBar(), Props, MobilizeProfilePageShell(), Props, Tab, MobilizeSocialFeedShell() (+10 more)

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
Cohesion: 0.36
Nodes (7): buildCommentTree(), CommentNode, CommentRow, Ctx, GET(), loadMembership(), POST()

### Community 111 - "ReportsCityHeatmapMap.tsx"
Cohesion: 0.36
Nodes (5): barColorForPercent(), HEAT_STOPS, heatRgb(), ReportsCityHeatmapMap(), RsmGeo

### Community 112 - "registry.ts"
Cohesion: 0.20
Nodes (16): chunkIdsForInQuery(), listUserRoleJoinsByUserIds(), countDashboardUsersMissionsStarted(), isMissionsStartedForUser(), loadMissionsStartedUserIds(), countInviteShareMetrics(), countMobilizeChapterGroups(), countStartedMissions() (+8 more)

### Community 113 - "Community 113"
Cohesion: 0.31
Nodes (8): destRoot, __dirname, downloadZip(), main(), marker, rmrf(), root, unzip()

### Community 114 - "loadMobilizeGroupCreatorPolicy"
Cohesion: 0.13
Nodes (19): NewCourseForm(), FirstLoginPasswordGate(), CatOpt, ChapterOpt, GatheringForm(), GatheringStatus, accept, GatheringImageFields() (+11 more)

### Community 115 - "certificate-requests.ts"
Cohesion: 0.36
Nodes (7): isUserCourseComplete(), userCompletedAllSessions(), CertificateRequestStatus, ExternalCertificateCtaState, loadExternalCertificateCtaState(), shouldShowExternalCertificatePrompt(), userHasPendingCertificateRequest()

### Community 117 - "Community 117"
Cohesion: 0.16
Nodes (22): POST(), GET(), PATCH(), RouteCtx, rowToCampaign(), GET(), POST(), rowToCampaign() (+14 more)

### Community 118 - "MobilizeBottomNavBar.tsx"
Cohesion: 0.25
Nodes (7): MISSION_DIFFICULTY_COLORS, MISSION_DIFFICULTY_LABELS, MISSION_PHASES, MissionCard, MissionDifficulty, MissionPhase, TWELVE_MISSIONS

### Community 119 - "parse-upload.ts"
Cohesion: 0.29
Nodes (8): GlobalContainerShareItemListener(), ChapterInviteShareDialog(), chapterInviteShareText(), logInviteShare(), Props, shareHref(), SharePlatform, SOCIAL_BUTTONS

### Community 120 - "MissionBriefingPageContent.tsx"
Cohesion: 0.38
Nodes (3): MissionBriefingPageInner(), MissionBriefingPage(), loadBriefingVideoUrl()

### Community 121 - "Community 121"
Cohesion: 0.42
Nodes (6): GET(), AvailableProviders, envSet(), isEmailProviderConfigured(), isTwilioSmsConfigured(), listAvailableProviders()

### Community 123 - "page.tsx"
Cohesion: 0.32
Nodes (11): US_STATE_FLAG_URL_BY_FIPS, usStateByCode(), escapeRegExp(), normalizeUsStateFromText(), parseStateFromUsAddress(), ResolveStateInput, STATES_BY_NAME_LEN, resolveMobilizeGroupStateCode() (+3 more)

### Community 124 - "Community 124"
Cohesion: 0.16
Nodes (16): CourseQuizBlock(), correctMulti(), correctSingle(), correctText(), correctTf(), effectiveMaxScore(), gradeQuizPayload(), questionCorrect() (+8 more)

### Community 126 - "Community 126"
Cohesion: 0.48
Nodes (5): MobilizeChapterFeedBanner(), Props, MobilizeGroupStateInfo, MOBILIZE_CHAPTER_FEED_BANNER_ASPECT, mobilizeChapterBannerHeading()

### Community 127 - "Community 127"
Cohesion: 0.24
Nodes (10): arcs, bbox, geometries, type, objects, nation, states, transform (+2 more)

### Community 128 - "parse-upload.ts"
Cohesion: 0.52
Nodes (6): normalizeKeys(), ParsedUpload, parseUploadFile(), pickBestSheetRows(), rowsFromSheet(), stringifyCell()

### Community 129 - "Community 129"
Cohesion: 0.28
Nodes (11): buildCalendarDays(), CoachMeetingBookingPanel(), displayNameFromUser(), formatDisplayDate(), isPastDate(), Props, TIME_SLOTS, CoachMeetingBooking (+3 more)

### Community 130 - "page.tsx"
Cohesion: 0.39
Nodes (7): sendBroadcastEmail(), sendBroadcastSms(), SendEmailPayload, sendViaBrevo(), sendViaDashboard(), sendViaMailchimpTransactional(), sendViaSendGrid()

### Community 131 - "us-city-coordinates.ts"
Cohesion: 0.48
Nodes (6): CITY_COORDS, cityLookupKey(), hashString(), jitterAroundCentroid(), resolveCityCoordinates(), STATE_CENTROIDS

### Community 132 - "training-feed.ts"
Cohesion: 0.08
Nodes (39): GET(), GET(), GET(), GET(), POST(), Ctx, GET(), GET() (+31 more)

### Community 133 - "PeopleOverviewClient.tsx"
Cohesion: 0.40
Nodes (5): baseOpts, Chart, PeopleOverviewClient(), relativeTime(), PeopleOverviewStats

### Community 134 - "normalizeAnnouncementPdfUrl"
Cohesion: 0.80
Nodes (3): GET(), isPdfMagic(), normalizeAnnouncementPdfUrl()

### Community 135 - "Community 135"
Cohesion: 0.21
Nodes (11): baseOpts, buildWeeklyBuckets(), CertificateRequestsStatsPanel(), Chart, formatDays(), formatWeekLabel(), Props, RequestRow (+3 more)

### Community 138 - "nprogress"
Cohesion: 0.08
Nodes (38): Ctx, isApprovedMember(), POST(), Ctx, loadMembership(), POST(), DELETE(), GET() (+30 more)

### Community 140 - "Community 140"
Cohesion: 0.14
Nodes (22): MissionRankInfoDialog(), Props, formatCompactCount(), formatRoleSlug(), formatStateForDisplay(), primaryRoleLabel(), ProfileRow, UserProfileDrawer() (+14 more)

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
Cohesion: 0.07
Nodes (19): AdminRolesPage(), AdminsPage(), ChaptersPage(), BroadcastHistoryPage(), BroadcastSendPage(), CourseBySlugPage(), CoursesPage(), DonatePage() (+11 more)

### Community 150 - "Community 150"
Cohesion: 0.53
Nodes (4): deploy_clone(), prepare_clone(), deploy-both-sites.sh script, verify_site()

### Community 151 - "Community 151"
Cohesion: 0.33
Nodes (4): admin, key, ROOT, url

### Community 152 - "Community 152"
Cohesion: 0.23
Nodes (9): GET(), MobilizeRecommendationsCard(), MobilizeSocialHubRightRail(), Props, extractTopicsFromText(), HubSidebarPayload, HubTopic, loadMobilizeHubSidebar() (+1 more)

### Community 160 - "Community 160"
Cohesion: 0.27
Nodes (11): hexToRgb(), MissionCardItem(), phaseHoverShadow(), CUSTOM_PARTNER_LOGO_SIZES, MISSION_PARTNER_LOGOS, missionPartnerLogoCustomSize(), MissionPartnerLogoSize, missionPartnerLogoUrl() (+3 more)

### Community 162 - "isNavModuleAllowedForRoles"
Cohesion: 0.39
Nodes (8): PeoplePage(), PeoplePageContent(), canAccessPeopleLeaders(), canAccessPeopleMembers(), canAccessPeopleOverview(), canAccessPeopleSection(), isDashboardPeopleSectionBlocked(), loadDashboardPeopleAccess()

### Community 165 - "ChapterInviteShareDialog.tsx"
Cohesion: 0.33
Nodes (3): ChapterMapInviteCta(), SharePlatform, SOCIAL_BUTTONS

### Community 169 - "UserNotesAdminClient.tsx"
Cohesion: 0.60
Nodes (4): formatWhen(), notePreview(), UserNotesAdminClient(), PersonNoteAdminRow

### Community 186 - "CourseIntroVideoBlock.tsx"
Cohesion: 0.16
Nodes (11): InviteFriendsBanner(), CourseIntroVideoBlock(), Props, ExternalTrainingCertificateBanner(), Props, assignmentSteps, checklist, IntroVideoAdminProps (+3 more)

### Community 188 - "route.ts"
Cohesion: 0.15
Nodes (13): baseOpts, Chart, emailFromSuggestionLabel(), JourneyProgressAdminClient(), JourneyProgressFilter, JourneyProgressRow, JourneyProgressStats, JOURNEY_PROGRESS_SORT_KEYS (+5 more)

## Knowledge Gaps
- **695 isolated node(s):** `next/core-web-vitals`, `next/typescript`, `nextConfig`, `name`, `version` (+690 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createAdminClient()` connect `Community 43` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 8`, `Community 13`, `Community 14`, `Community 16`, `Community 23`, `Community 32`, `isNavModuleAllowedForRoles`, `Community 40`, `Community 45`, `Community 46`, `Community 62`, `Community 64`, `Community 65`, `Community 82`, `Community 85`, `Community 91`, `Community 94`, `Community 97`, `Community 102`, `Community 104`, `getMailTransportAndFrom`, `Community 117`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `xlsx` connect `Community 23` to `parse-upload.ts`, `Community 9`, `Community 31`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 9` to `Community 142`, `Community 147`, `Community 23`, `Community 153`, `Community 154`, `Community 28`, `react-easy-crop`, `Community 201`, `Community 202`, `Community 206`, `@fortawesome/fontawesome-svg-core`, `Community 211`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/react-fontawesome`, `google-auth-library`, `isomorphic-dompurify`, `leaflet`, `leaflet.markercluster`, `@mui/icons-material`, `@mui/material`, `@mui/material-nextjs`, `Community 95`, `next`, `nodemailer`, `plyr`, `react`, `react-apexcharts`, `react-dom`, `react-dropzone`, `react-leaflet`, `react-simple-maps`, `stripe`, `@supabase/ssr`, `@supabase/supabase-js`, `tinymce`, `@tinymce/tinymce-react`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `next/typescript`, `nextConfig` to the rest of the system?**
  _695 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08871287128712871 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.07950310559006211 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._