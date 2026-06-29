import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookmark,
  faBuilding,
  faCircleUser,
  faCircleXmark,
  faClipboard,
  faFlag,
  faHandshake,
  faHouse,
  faMap,
  faPenToSquare,
  faStar,
  faUser,
} from "@fortawesome/free-regular-svg-icons";

export type MissionCard = {
  number: number;
  title: string;
  partner: string;
  icon: IconDefinition;
};

export type MissionSection = {
  id: string;
  heading: string;
  missions: MissionCard[];
};

export const TWELVE_MISSIONS_SECTIONS: MissionSection[] = [
  {
    id: "civic-literacy",
    heading: "Restore civic literacy & informed patriotism",
    missions: [
      {
        number: 1,
        title: "Be a force multiplier — host a bibcit class",
        partner: "Partner: Patriot Academy · Flashpoint Coach Dashboard",
        icon: faMap,
      },
      {
        number: 2,
        title: "Plan celebrations on key holidays",
        partner: "July 4 · Constitution Day · Veterans Day · Bill of Rights Day · Memorial Day",
        icon: faStar,
      },
      {
        number: 3,
        title: "Offer constitution day & celebrate freedom week to local schools",
        partner: "Partner: Patriot Academy · Coach Dashboard",
        icon: faBuilding,
      },
      {
        number: 4,
        title: "Recruit, train & elect biblical leaders to local office",
        partner: "Partner: For Liberty & Justice",
        icon: faPenToSquare,
      },
    ],
  },
  {
    id: "religious-liberty",
    heading: "Restore religious liberty & god-consciousness",
    missions: [
      {
        number: 5,
        title: "Display 'in god we trust' in gov't buildings & schools",
        partner: "Partner: Jacquie Sullivan · InGodWeTrustAmerica.org",
        icon: faFlag,
      },
      {
        number: 6,
        title: "Display the ten commandments in gov't buildings & schools",
        partner: "Partners: Restoring Faith in America · First Liberty",
        icon: faClipboard,
      },
      {
        number: 7,
        title: "Get bible curriculum back into local schools",
        partner: "Partners: PA Bible Literacy Project (in-school) · LifeWise (Time Release)",
        icon: faBookmark,
      },
      {
        number: 8,
        title: "Get chaplains into local schools",
        partner: "Partner: Rocky Malloy · NSCA.global",
        icon: faUser,
      },
    ],
  },
  {
    id: "limited-government",
    heading: "Restore limited government",
    missions: [
      {
        number: 9,
        title: "Ban sharia · reverse migration · citizen-only enumeration",
        partner: "Partners: BanSharia.com · ConventionOfStates.com",
        icon: faCircleXmark,
      },
      {
        number: 10,
        title: "Restore parental rights (state & federal amendment)",
        partner: "Partner: ParentalRights.org",
        icon: faCircleUser,
      },
      {
        number: 11,
        title: "Restore property rights — pass a property owner bill of rights",
        partner: "No partner · Tools in FP Chapter site & Coach Dashboard",
        icon: faHouse,
      },
      {
        number: 12,
        title: "Restore federalism — shrink federal gov't to its constitutional role",
        partner: "Partner: ConventionOfStates.com",
        icon: faHandshake,
      },
    ],
  },
];
