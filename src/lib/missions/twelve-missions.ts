import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faChalkboardUser,
  faFlag,
  faGraduationCap,
  faHandsPraying,
  faLandmark,
  faPeopleRoof,
  faSchool,
  faShareNodes,
  faShield,
  faUserGroup,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";

export type MissionDifficulty = "beginner" | "intermediate" | "advanced";

export const MISSION_DIFFICULTY_STYLES: Record<
  MissionDifficulty,
  { color: string; label: string; phases: string }
> = {
  beginner: { color: "#2e7d32", label: "Beginner", phases: "Phase 1–2" },
  intermediate: { color: "#e6a800", label: "Intermediate", phases: "Phase 3" },
  advanced: { color: "#c62828", label: "Advanced", phases: "Phase 4" },
};

export type MissionCard = {
  number: number;
  title: string;
  description: string;
  partner?: string;
  icon: IconDefinition;
  difficulty: MissionDifficulty;
};

export const TWELVE_MISSIONS: MissionCard[] = [
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
      "Learn who represents your city, county, state and Washington. Know how to contact them. Know how they vote. (This mission is absolutely missing.)",
    icon: faLandmark,
    difficulty: "beginner",
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
  {
    number: 5,
    title: "Complete Biblical Citizenship",
    description: "Become equipped. NOW they're motivated. Not first.",
    partner: "Partner: Patriot Academy",
    icon: faGraduationCap,
    difficulty: "beginner",
  },
  {
    number: 6,
    title: "Become a Biblical Citizenship Coach",
    description: "Now it makes sense. Not before.",
    icon: faChalkboardUser,
    difficulty: "beginner",
  },
  {
    number: 7,
    title: "Restore Faith in Schools",
    description:
      "Bible curriculum. Chaplains. Religious liberty. Combine these. People don't understand the difference.",
    icon: faSchool,
    difficulty: "intermediate",
  },
  {
    number: 8,
    title: "Display America's Foundations",
    description:
      "In God We Trust. Ten Commandments. Historical monuments. This becomes one mission.",
    icon: faBookOpen,
    difficulty: "intermediate",
  },
  {
    number: 9,
    title: "Support Parents & Families",
    description: "Parental Rights. Family values. Schools.",
    icon: faPeopleRoof,
    difficulty: "intermediate",
  },
  {
    number: 10,
    title: "Build Your Chapter",
    description: "Become a leader. Recruit. Organize. Multiply.",
    icon: faUserGroup,
    difficulty: "advanced",
  },
  {
    number: 11,
    title: "Encourage Biblical Leaders",
    description: "For Liberty & Justice. Candidates. Local office Training.",
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
];
