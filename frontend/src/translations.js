export const UI_TEXT = {
  en: {
    heroHeadline: "Got a suspicious message?",
    heroSub: "Paste it, snap it, or say it. We’ll tell you if it’s a scam.",
    heroCta: "Check a message now",
    analyzerEyebrow: "Your first line of defense",
    analyzerTitle: "Check a message, screenshot, or voice note",
    analyzerHelp: "Choose an input below. Sachet checks for common fraud signals and gives you practical next steps.",
    tabPaste: "Paste",
    tabSnap: "Screenshot",
    tabSpeak: "Speak",
    pastePlaceholder: "Paste the SMS, WhatsApp message, or email here...",
    uploadPrompt: "Tap to choose a screenshot",
    micStart: "Tap to record",
    micStop: "Stop recording",
    checkBtn: "Check this message",
    clear: "Clear",
    checkAnother: "Check another message",
    analyzingStates: ["Reading carefully...", "Checking for tricks...", "Analyzing patterns..."],
    
    // Verdicts
    verdictScamTitle: "This looks like a SCAM",
    verdictWarnTitle: "Be careful",
    verdictSafeTitle: "Looks okay, but stay alert",
    flagsTitle: "Why we think so:",
    stepsTitle: "What to do now:",
    
    // Actions
    call1930: "Call 1930 helpline",
    reportGov: "Report on cybercrime.gov.in",
    shareWarning: "Share warning",
    disclaimerSafe: "Never share your OTP, PIN or password with anyone.",
    disclaimerGeneral: "Sachet helps you decide. It isn't proof.",
    howWeDecided: "How we decided (Technical Details)",
    privacyFooter: "We never store your messages.",
    madeBy: "Made by Vivi",
    
    // Errors
    errEmpty: "Message is too short to analyze.",
    errNetwork: "Cannot reach the server right now. Please try again.",
    errTimeout: "Analysis took too long. Please try again.",
    errRateLimit: "Too many requests. Please wait a minute.",
    errImage: "Please upload a valid image under 5MB.",
    errMic: "Microphone access denied. Please check your browser settings.",
    errModel: "We couldn't tell. Please be careful and call 1930 if unsure.",
    
    samples: [
      { label: "Electricity Bill", text: "Your electricity bill is overdue. Pay Rs 1500 immediately or connection will be cut. Click bit.ly/pay-now" },
      { label: "Bank Alert", text: "Dear SBI customer, your OTP for transaction is 482917. Do not share this OTP with anyone." }
    ]
  },
  hi: {
    heroHeadline: "कोई संदिग्ध मैसेज मिला?",
    heroSub: "पेस्ट करें, फोटो अपलोड करें या बोलें। हम बताएंगे कि यह धोखाधड़ी है या नहीं।",
    heroCta: "मैसेज की जांच करें",
    analyzerEyebrow: "सुरक्षा की पहली परत",
    analyzerTitle: "मैसेज, स्क्रीनशॉट या वॉइस नोट की जांच करें",
    analyzerHelp: "नीचे कोई विकल्प चुनें। सचेत धोखाधड़ी के आम संकेतों की जांच करके आगे के कदम बताएगा।",
    tabPaste: "पेस्ट करें",
    tabSnap: "स्क्रीनशॉट",
    tabSpeak: "बोलें",
    pastePlaceholder: "संदिग्ध एसएमएस, व्हाट्सएप या ईमेल यहाँ पेस्ट करें...",
    uploadPrompt: "स्क्रीनशॉट चुनने के लिए टैप करें",
    micStart: "रिकॉर्ड करने के लिए टैप करें",
    micStop: "रिकॉर्डिंग रोकें",
    checkBtn: "इस संदेश की जांच करें",
    clear: "साफ़ करें",
    checkAnother: "दूसरा संदेश जांचें",
    analyzingStates: ["ध्यान से पढ़ रहे हैं...", "धोखाधड़ी की जांच कर रहे हैं...", "पैटर्न का विश्लेषण कर रहे हैं..."],
    
    verdictScamTitle: "यह धोखाधड़ी (SCAM) लग रहा है",
    verdictWarnTitle: "सावधान रहें",
    verdictSafeTitle: "सुरक्षित लग रहा है, फिर भी सतर्क रहें",
    flagsTitle: "हमें ऐसा क्यों लगता है:",
    stepsTitle: "अब क्या करें:",
    
    call1930: "1930 हेल्पलाइन पर कॉल करें",
    reportGov: "cybercrime.gov.in पर रिपोर्ट करें",
    shareWarning: "चेतावनी साझा करें",
    disclaimerSafe: "अपना ओटीपी, पिन या पासवर्ड कभी किसी के साथ शेयर न करें।",
    disclaimerGeneral: "सचेत केवल निर्णय लेने में मदद करता है। यह कोई प्रमाण नहीं है।",
    howWeDecided: "हमने यह निर्णय कैसे लिया (तकनीकी जानकारी)",
    privacyFooter: "हम आपके संदेश कभी सेव नहीं करते।",
    madeBy: "Vivi द्वारा निर्मित",
    
    errEmpty: "संदेश विश्लेषण के लिए बहुत छोटा है।",
    errNetwork: "सर्वर से संपर्क नहीं हो पा रहा है। कृपया पुनः प्रयास करें।",
    errTimeout: "जांच में बहुत समय लग रहा है। कृपया पुनः प्रयास करें।",
    errRateLimit: "बहुत अधिक अनुरोध। कृपया एक मिनट प्रतीक्षा करें।",
    errImage: "कृपया 5MB से कम का वैध चित्र अपलोड करें।",
    errMic: "माइक्रोफ़ोन की अनुमति नहीं है। ब्राउज़र सेटिंग्स जांचें।",
    errModel: "हम स्पष्ट नहीं कह सकते। कृपया सावधान रहें और संदेह होने पर 1930 पर कॉल करें।",
    
    samples: [
      { label: "KYC धोखाधड़ी", text: "Apka KYC expire ho gaya hai. Account block hone se pehle is link pe click karein: kyc-update.xyz" },
      { label: "डिजिटल अरेस्ट", text: "Digital arrest warrant issued by Police. Call 011-XXXX immediately or FIR will be filed." }
    ]
  },
  bn: {
    heroHeadline: "সন্দেহজনক মেসেজ পেয়েছেন?",
    heroSub: "পেস্ট করুন, ছবি আপলোড করুন বা বলুন। আমরা জানাবো এটি স্ক্যাম কি না।",
    heroCta: "বার্তাটি যাচাই করুন",
    analyzerEyebrow: "আপনার সুরক্ষার প্রথম ধাপ",
    analyzerTitle: "বার্তা, স্ক্রিনশট বা ভয়েস নোট যাচাই করুন",
    analyzerHelp: "নিচে একটি পদ্ধতি বেছে নিন। সাচেত প্রতারণার সাধারণ লক্ষণ খুঁজে পরবর্তী করণীয় জানাবে।",
    tabPaste: "পেস্ট করুন",
    tabSnap: "স্ক্রিনশট",
    tabSpeak: "বলুন",
    pastePlaceholder: "সন্দেহজনক এসএমএস, হোয়াটসঅ্যাপ বা ইমেল এখানে পেস্ট করুন...",
    uploadPrompt: "স্ক্রিনশট বেছে নিতে ট্যাপ করুন",
    micStart: "রেকর্ড করতে ট্যাপ করুন",
    micStop: "রেকর্ডিং থামান",
    checkBtn: "এই বার্তাটি যাচাই করুন",
    clear: "মুছে ফেলুন",
    checkAnother: "অন্য বার্তা যাচাই করুন",
    analyzingStates: ["মনোযোগ দিয়ে পড়ছি...", "প্রতারণার ফাঁদ খুঁজছি...", "বিশ্লেষণ করছি..."],
    
    verdictScamTitle: "এটি একটি স্ক্যাম (প্রতারণা) বলে মনে হচ্ছে",
    verdictWarnTitle: "সাবধান হোন",
    verdictSafeTitle: "নিরাপদ মনে হচ্ছে, তবে সতর্ক থাকুন",
    flagsTitle: "কেন আমরা এমনটা মনে করি:",
    stepsTitle: "এখন যা করবেন:",
    
    call1930: "১৯৩০ হেল্পলাইনে কল করুন",
    reportGov: "cybercrime.gov.in-এ রিপোর্ট করুন",
    shareWarning: "সতর্কতা শেয়ার করুন",
    disclaimerSafe: "আপনার ওটিপি, পিন বা পাসওয়ার্ড কখনোই কারো সাথে শেয়ার করবেন না।",
    disclaimerGeneral: "সাচেত আপনাকে সিদ্ধান্ত নিতে সাহায্য করে। এটি কোনো প্রমাণ নয়।",
    howWeDecided: "কীভাবে সিদ্ধান্ত নিলাম (কারিগরি বিবরণ)",
    privacyFooter: "আমরা কখনোই আপনার বার্তা জমা রাখি না।",
    madeBy: "Vivi তৈরি করেছে",
    
    errEmpty: "বার্তাটি বিশ্লেষণের জন্য খুবই ছোট।",
    errNetwork: "সার্ভারের সাথে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।",
    errTimeout: "বিশ্লেষণে খুব বেশি সময় লাগছে। আবার চেষ্টা করুন।",
    errRateLimit: "অতিরিক্ত অনুরোধ। এক মিনিট অপেক্ষা করুন।",
    errImage: "দয়া করে ৫ এমবি-র নিচে একটি বৈধ ছবি আপলোড করুন।",
    errMic: "মাইক্রোফোনের অনুমতি নেই। আপনার ব্রাউজার সেটিংস পরীক্ষা করুন।",
    errModel: "আমরা নিশ্চিত নই। অনুগ্রহ করে সতর্ক থাকুন এবং ১৯৩০ এ কল করুন।",
    
    samples: [
      { label: "লটারি স্ক্যাম", text: "আপনি KBC লটারিতে ৫০ লক্ষ টাকা জিতেছেন! এখনই রেজিস্ট্রেশন ফি ১০০০ টাকা পাঠান এই নম্বরে।" },
      { label: "অ্যাকাউন্ট ব্লক", text: "আপনার ব্যাংক অ্যাকাউন্ট ২৪ ঘণ্টার মধ্যে ব্লক হয়ে যাবে। ওটিপি পাঠান এখনই।" }
    ]
  }
};