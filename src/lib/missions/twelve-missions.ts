import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBookBible,
  faChildReaching,
  faFileCircleXmark,
  faFilePen,
  faHouseCircleCheck,
  faLandmark,
  faLocationDot,
  faScaleBalanced,
  faSchool,
  faShieldHalved,
  faStar,
  faTablets,
} from "@fortawesome/free-solid-svg-icons";

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
        icon: faLocationDot,
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
        icon: faLandmark,
      },
      {
        number: 4,
        title: "Recruit, train & elect biblical leaders to local office",
        partner: "Partner: For Liberty & Justice",
        icon: faFilePen,
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
        icon: faShieldHalved,
      },
      {
        number: 6,
        title: "Display the ten commandments in gov't buildings & schools",
        partner: "Partners: Restoring Faith in America · First Liberty",
        icon: faTablets,
      },
      {
        number: 7,
        title: "Get bible curriculum back into local schools",
        partner: "Partners: PA Bible Literacy Project (in-school) · LifeWise (Time Release)",
        icon: faBookBible,
      },
      {
        number: 8,
        title: "Get chaplains into local schools",
        partner: "Partner: Rocky Malloy · NSCA.global",
        icon: faSchool,
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
        icon: faFileCircleXmark,
      },
      {
        number: 10,
        title: "Restore parental rights (state & federal amendment)",
        partner: "Partner: ParentalRights.org",
        icon: faChildReaching,
      },
      {
        number: 11,
        title: "Restore property rights — pass a property owner bill of rights",
        partner: "No partner · Tools in FP Chapter site & Coach Dashboard",
        icon: faHouseCircleCheck,
      },
      {
        number: 12,
        title: "Restore federalism — shrink federal gov't to its constitutional role",
        partner: "Partner: ConventionOfStates.com",
        icon: faScaleBalanced,
      },
    ],
  },
];
