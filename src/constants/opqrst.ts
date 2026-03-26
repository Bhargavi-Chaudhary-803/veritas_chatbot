export type Language = "en" | "hi" | "hinglish";

export type Question = {
  key: string;
  stepOrder: number;
  type: "text" | "number" | "select";
  options?: string[];
  label: Record<Language, string>;
  placeholder?: Record<Language, string>;
};

export const questions: Question[] = [
  {
    key: "full_name",
    stepOrder: 1,
    type: "text",
    label: {
      en: "What is your full name?",
      hi: "आपका पूरा नाम क्या है?",
      hinglish: "Aapka full name kya hai?",
    },
    placeholder: {
      en: "Enter your full name",
      hi: "अपना पूरा नाम लिखें",
      hinglish: "Apna full name likho",
    },
  },
  {
    key: "age",
    stepOrder: 2,
    type: "number",
    label: {
      en: "What is your age?",
      hi: "आपकी उम्र क्या है?",
      hinglish: "Aapki age kya hai?",
    },
    placeholder: {
      en: "Enter your age",
      hi: "अपनी उम्र लिखें",
      hinglish: "Apni age likho",
    },
  },
  {
    key: "gender",
    stepOrder: 3,
    type: "select",
    options: ["male", "female", "other"],
    label: {
      en: "What is your gender?",
      hi: "आपका जेंडर क्या है?",
      hinglish: "Aapka gender kya hai?",
    },
  },
  {
    key: "chief_complaint",
    stepOrder: 4,
    type: "text",
    label: {
      en: "What is the main problem you are experiencing today?",
      hi: "आज आपको मुख्य समस्या क्या हो रही है?",
      hinglish: "Aaj aapko main problem kya ho rahi hai?",
    },
    placeholder: {
      en: "Example: headache, fever, stomach pain",
      hi: "उदाहरण: सिरदर्द, बुखार, पेट दर्द",
      hinglish: "Example: headache, fever, stomach pain",
    },
  },
  {
    key: "onset",
    stepOrder: 5,
    type: "text",
    label: {
      en: "When did it start?",
      hi: "यह कब शुरू हुआ?",
      hinglish: "Yeh kab start hua?",
    },
    placeholder: {
      en: "Example: 2 days ago",
      hi: "उदाहरण: 2 दिन पहले",
      hinglish: "Example: 2 din pehle",
    },
  },
  {
    key: "provocation",
    stepOrder: 6,
    type: "text",
    label: {
      en: "What makes it worse?",
      hi: "यह किससे बढ़ता है?",
      hinglish: "Yeh kis se zyada hota hai?",
    },
    placeholder: {
      en: "Example: walking, eating, movement",
      hi: "उदाहरण: चलना, खाना, हिलना",
      hinglish: "Example: walking, eating, movement",
    },
  },
  {
    key: "palliation",
    stepOrder: 7,
    type: "text",
    label: {
      en: "What makes it better or gives relief?",
      hi: "यह किससे कम होता है या राहत मिलती है?",
      hinglish: "Yeh kis se kam hota hai ya relief milta hai?",
    },
    placeholder: {
      en: "Example: rest, water, medicine",
      hi: "उदाहरण: आराम, पानी, दवा",
      hinglish: "Example: rest, water, medicine",
    },
  },
  {
    key: "quality",
    stepOrder: 8,
    type: "text",
    label: {
      en: "How does it feel?",
      hi: "यह कैसा महसूस होता है?",
      hinglish: "Yeh kaisa feel hota hai?",
    },
    placeholder: {
      en: "Example: sharp, dull, burning, throbbing",
      hi: "उदाहरण: तेज, हल्का, जलन, धड़कन जैसा",
      hinglish: "Example: sharp, dull, burning, throbbing",
    },
  },
  {
    key: "region",
    stepOrder: 9,
    type: "text",
    label: {
      en: "Where exactly is it located?",
      hi: "यह ठीक कहाँ हो रहा है?",
      hinglish: "Yeh exactly kahan ho raha hai?",
    },
    placeholder: {
      en: "Example: left side of head",
      hi: "उदाहरण: सिर के बाईं तरफ",
      hinglish: "Example: left side of head",
    },
  },
  {
    key: "radiation",
    stepOrder: 10,
    type: "text",
    label: {
      en: "Does it spread anywhere else?",
      hi: "क्या यह कहीं और फैलता है?",
      hinglish: "Kya yeh kahin aur spread hota hai?",
    },
    placeholder: {
      en: "Example: to neck, back, arm",
      hi: "उदाहरण: गर्दन, पीठ, बाजू तक",
      hinglish: "Example: to neck, back, arm",
    },
  },
  {
    key: "severity",
    stepOrder: 11,
    type: "number",
    label: {
      en: "On a scale of 1 to 10, how severe is it?",
      hi: "1 से 10 के पैमाने पर यह कितना गंभीर है?",
      hinglish: "1 se 10 scale par yeh kitna severe hai?",
    },
    placeholder: {
      en: "Enter a number from 1 to 10",
      hi: "1 से 10 तक संख्या लिखें",
      hinglish: "1 se 10 tak number likho",
    },
  },
  {
    key: "timing",
    stepOrder: 12,
    type: "text",
    label: {
      en: "Is it constant or does it come and go?",
      hi: "क्या यह लगातार है या आता-जाता है?",
      hinglish: "Yeh constant hai ya aata-jaata hai?",
    },
    placeholder: {
      en: "Example: constant, comes and goes",
      hi: "उदाहरण: लगातार, आता-जाता",
      hinglish: "Example: constant, comes and goes",
    },
  },
];