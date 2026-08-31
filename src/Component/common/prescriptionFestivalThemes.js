import baisakhi from "../../assets/baisakhi.png";
import christmas from "../../assets/christmas.png";
import defaultGeneral from "../../assets/default_general.png";
import diwali from "../../assets/diwali.png";
import dussehra from "../../assets/dussehra.png";
import eid from "../../assets/eid.png";
import ganeshChaturthi from "../../assets/ganesh_chaturthi.png";
import holi from "../../assets/holi.png";
import independenceDay from "../../assets/independence_day.png";
import janmashtami from "../../assets/janmashtami.png";
import makarSankranti from "../../assets/makar_sankranti.png";
import navratri from "../../assets/navratri.png";
import newYear from "../../assets/new_year.png";
import rakshaBandhan from "../../assets/raksha_bandhan.png";
import republicDay from "../../assets/republic_day.png";

export const PRESCRIPTION_FESTIVAL_THEMES = [
  ["default_general", "General", defaultGeneral],
  ["baisakhi", "Baisakhi", baisakhi],
  ["christmas", "Christmas", christmas],
  ["diwali", "Diwali", diwali],
  ["dussehra", "Dussehra", dussehra],
  ["eid", "Eid", eid],
  ["ganesh_chaturthi", "Ganesh Chaturthi", ganeshChaturthi],
  ["holi", "Holi", holi],
  ["independence_day", "Independence Day", independenceDay],
  ["janmashtami", "Janmashtami", janmashtami],
  ["makar_sankranti", "Makar Sankranti", makarSankranti],
  ["navratri", "Navratri", navratri],
  ["new_year", "New Year", newYear],
  ["raksha_bandhan", "Raksha Bandhan", rakshaBandhan],
  ["republic_day", "Republic Day", republicDay],
].map(([id, label, image]) => ({ id, label, image }));

export const getPrescriptionFestivalTheme = (id) =>
  PRESCRIPTION_FESTIVAL_THEMES.find((theme) => theme.id === id) ||
  PRESCRIPTION_FESTIVAL_THEMES[0];
