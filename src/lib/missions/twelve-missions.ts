import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookOpen,
  faBullhorn,
  faChalkboardUser,
  faFlag,
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

export const MISSION_DIFFICULTY_COLORS: Record<MissionDifficulty, string> = {
  beginner: "#2e7d32",
  intermediate: "#c9a227",
  advanced: "#737373",
};

export type MissionCard = {
  number: number;
  title: string;
  description: string;
  partner?: string;
  url?: string;
  icon: IconDefinition;
  difficulty: MissionDifficulty;
  comingSoon?: boolean;
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
  {
    number: 5,
    title: "Contact Your Lawmakers",
    description:
      "Send emails, letters, or make phone calls regarding important legislation through action alerts (such as ACT for America).",
    icon: faBullhorn,
    difficulty: "beginner",
    url: "https://www.actforamerica.org/",
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
    title: "Restore Faith in Schools",
    description:
      "Bible curriculum. Chaplains. Religious liberty. Combine these. People don't understand the difference.",
    icon: faSchool,
    difficulty: "intermediate",
    url: "https://www.nsca.global/certification",
  },
  {
    number: 8,
    title: "Display America's Foundation",
    description:
      "In God We Trust. Ten Commandments. Historical monuments. This becomes one mission.",
    icon: faBookOpen,
    difficulty: "intermediate",
    url: "https://rfia.org/#welcome",
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
];
