import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faBullhorn,
  faChalkboardUser,
  faLandmark,
  faNewspaper,
  faPenToSquare,
  faSchool,
  faShareNodes,
  faShield,
  faSquarePollVertical,
  faUserGroup,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";

export type MissionDifficulty = "beginner" | "intermediate" | "advanced";

export const MISSION_DIFFICULTY_COLORS: Record<MissionDifficulty, string> = {
  beginner: "#2e7d32",
  intermediate: "#c9a227",
  advanced: "#737373",
};

export const MISSION_DIFFICULTY_LABELS: Record<MissionDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export type MissionCard = {
  number: number;
  title: string;
  description: string;
  partner?: string;
  url?: string;
  /** Custom link CTA after description (default: "Click Here"). */
  linkLabel?: string;
  /** Opens the chapter invite share dialog instead of an external URL. */
  opensShareDialog?: boolean;
  /** Explicit partner logo when there is no external URL to map. */
  partnerLogoUrl?: string;
  /** Larger logo footprint (55px desktop / 40px mobile). */
  partnerLogoSize?: "default" | "tall";
  icon: IconDefinition;
  difficulty: MissionDifficulty;
  comingSoon?: boolean;
};

export type MissionPhase = {
  id: string;
  title: string;
  subtitle?: string;
  difficulty: MissionDifficulty;
  headerBg: string;
  /** Overrides beginner green on link/share buttons for this phase. */
  actionColor?: string;
  missions: MissionCard[];
};

export const MISSION_PHASES: MissionPhase[] = [
  {
    id: "phase-1",
    title: "PHASE 1 — Live It",
    difficulty: "beginner",
    headerBg: "#1f5c38",
    missions: [
      {
        number: 1,
        title: "Start Inviting",
        description:
          "Help us reach our next milestone of 20,000 members. Invite at least 5 people who love God and America to join the movement. Every invitation makes a difference.",
        icon: faShareNodes,
        difficulty: "beginner",
        opensShareDialog: true,
        linkLabel: "Start Inviting",
      },
      {
        number: 2,
        title: "Share News!",
        description:
          "We built a news center so you can stay informed and share the latest stories. Share at least 2 or 3 news items a day on your social networks.",
        icon: faNewspaper,
        difficulty: "beginner",
        url: "https://fptn.com/news",
        linkLabel: "Visit the news center",
      },
      {
        number: 3,
        title: "Know Your Representatives",
        description:
          "Learn who represents your city, county, state and Washington. Know how to contact them. Know how they vote.",
        icon: faLandmark,
        difficulty: "beginner",
        url: "https://www.house.gov/representatives/find-your-representative",
      },
      {
        number: 4,
        title: "Start posting here",
        description:
          "FlashPoint Command Center is more than a social network. We focus on mobilizing the Church of Christ in the USA to defend the Constitution and the republic. Post every day.",
        icon: faPenToSquare,
        difficulty: "beginner",
        url: "/dashboard/mobilize/home",
        linkLabel: "Post now",
      },
    ],
  },
  {
    id: "phase-2",
    title: "PHASE 2 — Engage",
    difficulty: "beginner",
    headerBg: "#7E6BC4",
    actionColor: "#7E6BC4",
    missions: [
      {
        number: 5,
        title: "Join Your Local Chapter",
        description:
          "Approved leaders will begin launching local chapters across the country. As they become available, you'll be able to join a group, volunteer, participate in local gatherings, support community initiatives, and grow alongside other believers.",
        icon: faUserGroup,
        difficulty: "beginner",
        url: "/dashboard/mobilize/map",
        linkLabel: "Join groups",
      },
      {
        number: 6,
        title: "Contact Your Lawmakers",
        description:
          "Make your voice count. Send emails, letters, or make phone calls regarding important legislation through action alerts by ACT for America.",
        icon: faBullhorn,
        difficulty: "beginner",
        url: "https://www.actforamerica.org/",
        linkLabel: "Start Now",
      },
      {
        number: 7,
        title: "Become a Biblical Citizenship Coach",
        description: "Now it makes sense. Not before.",
        icon: faChalkboardUser,
        difficulty: "beginner",
        url: "https://www.patriotacademy.com/coach/flashpointarmy",
      },
      {
        number: 8,
        title: "Support Election Integrity",
        description:
          "Serve as a poll worker, poll watcher (where permitted), or volunteer in lawful voter education efforts.",
        icon: faSquarePollVertical,
        difficulty: "beginner",
        url: "https://www.eac.gov/election-officials/poll-watchers",
        linkLabel: "Start Now",
      },
    ],
  },
  {
    id: "phase-3",
    title: "PHASE 3 — Influence Your Community",
    difficulty: "intermediate",
    headerBg: "#6b5420",
    missions: [
      {
        number: 9,
        title: "Become a Federal Chaplain",
        description:
          "Bring hope and biblical values to your local community by becoming a certified chaplain through NSCA.",
        icon: faSchool,
        difficulty: "intermediate",
        url: "https://www.nsca.global/certification",
      },
      {
        number: 10,
        title: "Display America's Foundations",
        description:
          "Bring faith back to the Public Square. Help advance projects that promote America's biblical heritage, including Ten Commandments displays, monuments, educational initiatives through Restoring Faith in America.",
        icon: faBookOpen,
        difficulty: "intermediate",
        url: "https://rfia.org/#welcome",
        linkLabel: "Start Now",
      },
    ],
  },
  {
    id: "phase-4",
    title: "PHASE 4 — Lead",
    difficulty: "advanced",
    headerBg: "#525252",
    missions: [
      {
        number: 11,
        title: "Encourage Biblical Leaders",
        description: "For Liberty & Justice. Candidates. Local office. Training.",
        icon: faUserTie,
        difficulty: "advanced",
        partnerLogoUrl:
          "https://fparmychapters.com/wp-content/uploads/2026/07/For-Liberty-and-justice.webp",
        partnerLogoSize: "tall",
      },
      {
        number: 12,
        title: "Restore Constitutional Government",
        description:
          "Convention of States. Property Rights. Federalism. Sharia. Citizen Enumeration. This becomes the advanced civic mission.",
        icon: faShield,
        difficulty: "advanced",
      },
    ],
  },
];

export const TWELVE_MISSIONS: MissionCard[] = MISSION_PHASES.flatMap((phase) => phase.missions);
