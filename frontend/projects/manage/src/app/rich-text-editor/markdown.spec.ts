import { marked } from 'marked';
import { htmlToMarkdown, markdownToHtml } from './markdown';

// Rehovot's page as seeded into Firestore - real content, links, a loose contact list
const REHOVOT = "[המחלקה לגיל הרך](https://www.rehovot.muni.il/%D7%92%D7%99%D7%9C-%D7%99%D7%A0%D7%A7%D7%95%D7%AA/) כאן בשבילכן ובשבילכם כבר מההתחלה.\nאנו מובילים את העשייה העירונית בגיל הרך באמצעות פעולות רבות.\n\n* חינוך \\- הפעלת מערך הדרכה, איתור ותמיכה חינוכית והתפתחותית רשותי למסגרות לגילאי לידה עד 3\n* בריאות והתפתחות הילד \\- הפעלת מרכז גיל רך עירוני ויחידות התפתחותיות\n* קהילה ופנאי \\- ייזום מענים ופעילויות מגוונות בהתאם לצרכים של כלל ילדי לידה עד 3 בעיר ( הרצאות תוכן שונות, פעילויות טרום לידה מפגשי שטח עם אנשי מקצוע ועוד).\n* בקרה על ביטחון ובטיחות\n* קידום פעולות בשיתוף הורים, קהילה, מרכזים קהילתיים ועוד...\n* הנגשת מידע בתחום הגיל הרך להורים ולאנשי המקצוע בעיר\n* מיפוי מסגרות החינוך והשרותים השונים בעיר לילדי לידה עד 3\n* העמקת שיתופי הפעולה בין הגורמים הרבים המעניקים שירותי לגיל הרך כמו חינוך, רווחה, בריאות וטיפות חלב.\n* יצירת תשתית לשיח פתוח ומקדם אתכם הורים והנגשת מידע בסיסי עבורכם\n\n## אספנו עבורכם כמה קישורים שימושיים\n\n[משרד החינוך, פורטל הורים – מעונות יום](https://parents.education.gov.il/prhnet/gov-education/kindergarten/toddlers-home)\n\n[מידע בסיסי בנושא חוק המצלמות](https://www.kolzchut.org.il/he/%D7%9E%D7%A6%D7%9C%D7%9E%D7%95%D7%AA_%D7%91%D7%9E%D7%A2%D7%95%D7%A0%D7%95%D7%AA_%D7%99%D7%95%D7%9D_%D7%9C%D7%A4%D7%A2%D7%95%D7%98%D7%95%D7%AA)\n\n[בקשה לסייעת לילדים עם אלרגיה](https://www.gov.il/he/service/assistance-for-toddler-with-severe-allergy)\n\n## ניתן ליצור איתנו קשר לשאלות וסיוע\n\n* [המחלקה לגיל הרך](https://www.rehovot.muni.il/%D7%92%D7%99%D7%9C-%D7%99%D7%A0%D7%A7%D7%95%D7%AA/)\n\n  טלפון 089392154\n\n  מייל [gilrach@rehovot.muni.il](mailto:gilrach@rehovot.muni.il)\n\n* [המרכז לגיל הרך](https://www.rehovot.muni.il/92/)\n\n  טלפון 08-9469729\n\n  מייל [Merkaz.gil.rach@gmail.com](mailto:Merkaz.gil.rach@gmail.com)\n";

describe('city page markdown <-> editor html', () => {
  const render = (markdown: string) => marked.parse(markdown, {headerIds: false, mangle: false}).replace(/\s+/g, ' ');

  it('round-trips a real page without changing what the map app renders', () => {
    const roundTripped = htmlToMarkdown(markdownToHtml(REHOVOT));
    expect(render(roundTripped)).toEqual(render(REHOVOT));
  });

  it('is stable: a second round trip changes nothing', () => {
    const once = htmlToMarkdown(markdownToHtml(REHOVOT));
    expect(htmlToMarkdown(markdownToHtml(once))).toEqual(once);
  });

  it('writes tidy lists, as the editor produces them (paragraphs inside items)', () => {
    const html = '<h2>כותרת</h2><ul><li><p>אחת</p></li><li><p><a href="https://x.org">שתיים</a></p><p>טלפון 1</p></li></ul><ol><li><p>א</p></li><li><p>ב</p></li></ol>';
    expect(htmlToMarkdown(html)).toEqual('## כותרת\n\n* אחת\n* [שתיים](https://x.org)\n\n  טלפון 1\n\n1. א\n2. ב');
  });

  it('writes ### for the category headings', () => {
    expect(htmlToMarkdown('<h3>חינוך וטיפול בגיל הרך</h3>')).toEqual('### חינוך וטיפול בגיל הרך');
  });

  it('treats an empty editor as an empty page', () => {
    expect(htmlToMarkdown('<p></p>')).toEqual('');
  });
});
