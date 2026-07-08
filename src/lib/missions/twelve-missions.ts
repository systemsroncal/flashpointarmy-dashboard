import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faBullhorn,
  faChalkboardUser,
  faFlag,
  faHandsPraying,
  faLandmark,
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
  missions: MissionCard[];
};

export const MISSION_PHASES: MissionPhase[] = [
  {
    id: "phase-1",
    title: "PHASE 1 — Live It",
    subtitle: "Very easy wins. These require almost no commitment.",
    difficulty: "beginner",
    headerBg: "#1f5c38",
    missions: [
      {
        number: 1,
        title: "Celebrate America",
        description:
          "Celebrate July 4th, Constitution Day, Veterans Day, Memorial Day, Bill of Rights Day and teach your family why they matter.",
        icon: faFlag,
        difficulty: "beginner",
      },
      {
        number: 2,
        title: "Know Your Representatives",
        description:
          "Learn who represents your city, county, state and Washington. Know how to contact them. Know how they vote.",
        icon: faLandmark,
        difficulty: "beginner",
        url: "https://www.house.gov/representatives/find-your-representative",
      },
      {
        number: 3,
        title: "Pray for America",
        description:
          "Pray regularly for your nation, elected officials, schools, churches and communities. Prayer becomes a measurable mission.",
        icon: faHandsPraying,
        difficulty: "beginner",
      },
      {
        number: 4,
        title: "Share the Mission",
        description:
          "Invite friends, family and church members to join FlashPoint Army Chapters. Very simple. Everyone can do it.",
        icon: faShareNodes,
        difficulty: "beginner",
      },
    ],
  },
  {
    id: "phase-2",
    title: "PHASE 2 — Engage",
    subtitle: "Now they're engaged.",
    difficulty: "beginner",
    headerBg: "#1e5c56",
    missions: [
      {
        number: 5,
        title: "Contact Your Lawmakers",
        description:
          "Make your voice count. Send emails, letters, or make phone calls regarding important legislation through action alerts by ACT for America.",
        icon: faBullhorn,
        difficulty: "beginner",
        url: "https://www.actforamerica.org/",
        linkLabel: "Start Now",
      },
      {
        number: 6,
        title: "Become a Biblical Citizenship Coach",
        description: "Now it makes sense. Not before.",
        icon: faChalkboardUser,
        difficulty: "beginner",
        url: "https://www.patriotacademy.com/coach/flashpointarmy",
      },
      {
        number: 7,
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
        number: 8,
        title: "Restoring Faith in Schools",
        description:
          "Bring hope and biblical values to your local schools by becoming a certified chaplain by NSCA.",
        icon: faSchool,
        difficulty: "intermediate",
        url: "https://www.nsca.global/certification",
      },
      {
        number: 9,
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
        number: 10,
        title: "Join Your Local Chapter",
        description:
          "Over the next few weeks, approved leaders will begin launching local chapters across the country. As they become available, you'll be able to join a chapter, volunteer, participate in local gatherings, support community initiatives, and grow alongside other believers.",
        icon: faUserGroup,
        difficulty: "advanced",
        comingSoon: true,
      },
      {
        number: 11,
        title: "Encourage Biblical Leaders",
        description: "For Liberty & Justice. Candidates. Local office. Training.",
        icon: faUserTie,
        difficulty: "advanced",
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
