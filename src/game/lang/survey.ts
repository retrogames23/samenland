import type { Lang } from "../i18n";

type Q = { q: string; a: string[] };
type Text = {
  title: string; ask: string; sub: string; yes: string; later: string; never: string;
  qs: Q[]; wish: string; wishHint: string; step: (n: number, of: number) => string;
  back: string; next: string; send: string; thanks: string; close: string; failed: string;
};

/** Stable answer keys stored in the database, independent of the display language. */
export const SURVEY_KEYS = ["pace", "daily", "together", "next"] as const;

export const SURVEY: Record<Lang, Text> = {
  de: {
    title: "Umfrage", ask: "Hast du Lust an einer kurzen Umfrage zur Weiterentwicklung von Samenland teilzunehmen?",
    sub: "Dauert nur etwa eine Minute und hilft mir sehr.", yes: "Beantworten", later: "Frag mich das nächste Mal wieder", never: "Frag mich nie wieder",
    qs: [
      { q: "Wie empfindest du das Tempo, mit dem dein Dorf und die Bauwerke wachsen?", a: ["Genau richtig – herrlich entschleunigt.", "Etwas zu langsam – manchmal dauert das Warten zu lang.", "Deutlich zu langsam – ich möchte schneller vorankommen.", "Könnte sogar noch langsamer sein."] },
      { q: "Wenn du dein Dorf besuchst: Gibt es für dich im Moment genug zu tun?", a: ["Ja, ruhiges Beobachten und Planen reicht mir völlig.", "Ich hätte gern täglich 1–2 kleine Aufgaben oder Entscheidungen.", "Ich wünsche mir deutlich mehr aktive Eingriffsmöglichkeiten."] },
      { q: "Was reizt dich im Zusammenspiel mit anderen Spielern am meisten?", a: ["Gemeinsame Straßen, Handel und Nachbarschaftshilfe.", "Freundschaftlicher Vergleich – wer hat das prächtigere Dorf?", "Ich baue lieber ganz in Ruhe für mich allein."] },
      { q: "Worauf soll ich mich als Nächstes am meisten konzentrieren?", a: ["Mehr Dorfleben (Tiere, Feste, Handwerk, Sitten).", "Fürstenhof, Erlasse, Botengänge und Rittertitel.", "Tiefere Wirtschaft (Handelskarren, Zünfte, Veredelung).", "Mehr freie Dorfgestaltung (Gärten, Wegweiser, Schmuck)."] },
    ],
    wish: "Was liegt dir für Samenland besonders am Herzen – oder was fehlt dir noch?", wishHint: "Lob, Wünsche, Sorgen oder Ideen … (freiwillig)",
    step: (n, of) => `Frage ${n} von ${of}`, back: "Zurück", next: "Weiter", send: "Antworten versiegeln",
    thanks: "Herzlichen Dank! Deine Antworten helfen mir, Samenland in die richtige Richtung zu lenken.", close: "Schließen", failed: "Das hat leider nicht geklappt. Versuch es bitte noch einmal.",
  },
  en: {
    title: "Survey", ask: "Would you like to take a short survey about the future of Samenland?",
    sub: "It only takes about a minute and helps me a lot.", yes: "Take the survey", later: "Ask me next time", never: "Never ask me again",
    qs: [
      { q: "How do you feel about the pace at which your village and buildings grow?", a: ["Just right – wonderfully unhurried.", "A bit too slow – the waiting is sometimes too long.", "Much too slow – I want to progress faster.", "It could be even slower."] },
      { q: "When you visit your village: is there enough to do right now?", a: ["Yes, calmly watching and planning is plenty.", "I'd like 1–2 small tasks or decisions each day.", "I want many more ways to actively take part."] },
      { q: "What appeals to you most about playing alongside others?", a: ["Shared roads, trade and helping neighbours.", "Friendly comparison – whose village is grander?", "I prefer to build quietly on my own."] },
      { q: "What should I focus on next?", a: ["More village life (animals, festivals, crafts, customs).", "The prince's court, decrees, errands and knighthood.", "Deeper economy (trade carts, guilds, refining).", "More free village design (gardens, signposts, decorations)."] },
    ],
    wish: "What matters most to you about Samenland – or what is still missing?", wishHint: "Praise, wishes, worries or ideas … (optional)",
    step: (n, of) => `Question ${n} of ${of}`, back: "Back", next: "Next", send: "Seal my answers",
    thanks: "Thank you so much! Your answers help me steer Samenland in the right direction.", close: "Close", failed: "That didn't work. Please try again.",
  },
  fr: {
    title: "Sondage", ask: "As-tu envie de répondre à un court sondage sur l'avenir de Samenland ?",
    sub: "Cela ne prend qu'une minute environ et m'aide beaucoup.", yes: "Répondre", later: "Redemande-moi la prochaine fois", never: "Ne plus jamais me demander",
    qs: [
      { q: "Comment trouves-tu le rythme de croissance de ton village et de ses bâtiments ?", a: ["Parfait – merveilleusement paisible.", "Un peu trop lent – l'attente est parfois longue.", "Bien trop lent – je veux avancer plus vite.", "Il pourrait être encore plus lent."] },
      { q: "Quand tu visites ton village, y a-t-il assez à faire en ce moment ?", a: ["Oui, observer et planifier tranquillement me suffit.", "J'aimerais 1 à 2 petites tâches ou décisions par jour.", "Je souhaite bien plus de moyens d'agir."] },
      { q: "Qu'est-ce qui t'attire le plus dans le jeu avec les autres ?", a: ["Routes communes, commerce et entraide.", "La comparaison amicale – quel village est le plus beau ?", "Je préfère bâtir tranquillement seul."] },
      { q: "Sur quoi devrais-je me concentrer ensuite ?", a: ["Plus de vie au village (animaux, fêtes, artisanat, coutumes).", "La cour du prince, les édits, les missions et la chevalerie.", "Une économie plus riche (charrettes, guildes, transformation).", "Plus de liberté d'aménagement (jardins, panneaux, décorations)."] },
    ],
    wish: "Qu'est-ce qui te tient le plus à cœur pour Samenland – ou que manque-t-il ?", wishHint: "Éloges, souhaits, soucis ou idées … (facultatif)",
    step: (n, of) => `Question ${n} sur ${of}`, back: "Retour", next: "Suivant", send: "Sceller mes réponses",
    thanks: "Merci beaucoup ! Tes réponses m'aident à guider Samenland dans la bonne direction.", close: "Fermer", failed: "Cela n'a pas fonctionné. Réessaie, s'il te plaît.",
  },
  es: {
    title: "Encuesta", ask: "¿Te apetece responder una breve encuesta sobre el futuro de Samenland?",
    sub: "Solo dura un minuto y me ayuda mucho.", yes: "Responder", later: "Pregúntame la próxima vez", never: "No volver a preguntar",
    qs: [
      { q: "¿Qué te parece el ritmo al que crecen tu aldea y sus edificios?", a: ["Perfecto – maravillosamente pausado.", "Algo lento – a veces la espera es larga.", "Demasiado lento – quiero avanzar más rápido.", "Podría ser incluso más lento."] },
      { q: "Cuando visitas tu aldea, ¿hay ahora suficiente que hacer?", a: ["Sí, observar y planear con calma me basta.", "Me gustarían 1–2 pequeñas tareas o decisiones al día.", "Quiero muchas más formas de participar activamente."] },
      { q: "¿Qué es lo que más te atrae de jugar junto a otros?", a: ["Caminos compartidos, comercio y ayuda vecinal.", "La comparación amistosa – ¿qué aldea es más espléndida?", "Prefiero construir tranquilo por mi cuenta."] },
      { q: "¿En qué debería centrarme a continuación?", a: ["Más vida en la aldea (animales, fiestas, oficios, costumbres).", "La corte del príncipe, edictos, recados y caballería.", "Economía más profunda (carretas, gremios, elaboración).", "Más diseño libre de la aldea (jardines, señales, adornos)."] },
    ],
    wish: "¿Qué es lo que más te importa de Samenland, o qué echas en falta?", wishHint: "Elogios, deseos, preocupaciones o ideas … (opcional)",
    step: (n, of) => `Pregunta ${n} de ${of}`, back: "Atrás", next: "Siguiente", send: "Sellar respuestas",
    thanks: "¡Muchas gracias! Tus respuestas me ayudan a guiar Samenland en la dirección correcta.", close: "Cerrar", failed: "No ha funcionado. Inténtalo de nuevo.",
  },
  ar: {
    title: "استبيان", ask: "هل تود المشاركة في استبيان قصير حول تطوير سامنلاند؟",
    sub: "يستغرق دقيقة تقريبًا ويساعدني كثيرًا.", yes: "أجب", later: "اسألني في المرة القادمة", never: "لا تسألني مجددًا",
    qs: [
      { q: "ما رأيك في سرعة نمو قريتك ومبانيها؟", a: ["مناسبة تمامًا – هادئة ورائعة.", "بطيئة قليلًا – الانتظار طويل أحيانًا.", "بطيئة جدًا – أريد التقدم أسرع.", "يمكن أن تكون أبطأ أيضًا."] },
      { q: "عندما تزور قريتك: هل هناك ما يكفي لتفعله حاليًا؟", a: ["نعم، المراقبة والتخطيط بهدوء يكفيانني.", "أود مهمة أو قرارين صغيرين كل يوم.", "أتمنى طرقًا أكثر بكثير للمشاركة الفعلية."] },
      { q: "ما الذي يجذبك أكثر في اللعب مع الآخرين؟", a: ["الطرق المشتركة والتجارة ومساعدة الجيران.", "المقارنة الودية – أي قرية أبهى؟", "أفضّل البناء بهدوء وحدي."] },
      { q: "على ماذا يجب أن أركز بعد ذلك؟", a: ["مزيد من حياة القرية (حيوانات، أعياد، حِرف، عادات).", "بلاط الأمير والمراسيم والمهام ولقب الفارس.", "اقتصاد أعمق (عربات تجارة، نقابات، تصنيع).", "حرية أكبر في تصميم القرية (حدائق، لافتات، زينة)."] },
    ],
    wish: "ما الذي يهمك أكثر في سامنلاند، أو ما الذي ينقصك؟", wishHint: "مديح أو أمنيات أو مخاوف أو أفكار … (اختياري)",
    step: (n, of) => `السؤال ${n} من ${of}`, back: "رجوع", next: "التالي", send: "اختم إجاباتي",
    thanks: "شكرًا جزيلًا! إجاباتك تساعدني على توجيه سامنلاند في الاتجاه الصحيح.", close: "إغلاق", failed: "لم ينجح ذلك. حاول مرة أخرى.",
  },
  hi: {
    title: "सर्वेक्षण", ask: "क्या आप सामनलैंड के आगे के विकास पर एक छोटे सर्वेक्षण में भाग लेना चाहेंगे?",
    sub: "इसमें लगभग एक मिनट लगता है और इससे मुझे बहुत मदद मिलती है।", yes: "उत्तर दें", later: "अगली बार फिर पूछें", never: "फिर कभी न पूछें",
    qs: [
      { q: "आपके गाँव और इमारतों के बढ़ने की गति आपको कैसी लगती है?", a: ["बिल्कुल सही – सुखद रूप से धीमी।", "थोड़ी धीमी – कभी-कभी इंतज़ार लंबा होता है।", "बहुत धीमी – मैं तेज़ी से आगे बढ़ना चाहता हूँ।", "और भी धीमी हो सकती है।"] },
      { q: "जब आप अपने गाँव आते हैं: क्या अभी करने को पर्याप्त है?", a: ["हाँ, शांति से देखना और योजना बनाना काफ़ी है।", "मुझे रोज़ 1–2 छोटे काम या निर्णय चाहिए।", "मुझे सक्रिय रूप से भाग लेने के कहीं अधिक तरीके चाहिए।"] },
      { q: "दूसरों के साथ खेलने में आपको सबसे अधिक क्या आकर्षित करता है?", a: ["साझा सड़कें, व्यापार और पड़ोसियों की मदद।", "मैत्रीपूर्ण तुलना – किसका गाँव अधिक भव्य है?", "मैं शांति से अकेले बनाना पसंद करता हूँ।"] },
      { q: "मुझे आगे किस पर सबसे अधिक ध्यान देना चाहिए?", a: ["अधिक ग्राम जीवन (पशु, उत्सव, शिल्प, रीति-रिवाज)।", "राजदरबार, फ़रमान, संदेश-कार्य और नाइट की उपाधि।", "गहरी अर्थव्यवस्था (व्यापार गाड़ियाँ, संघ, प्रसंस्करण)।", "गाँव की अधिक स्वतंत्र सजावट (बगीचे, संकेत, सजावट)।"] },
    ],
    wish: "सामनलैंड में आपके लिए सबसे महत्वपूर्ण क्या है – या अभी क्या कमी है?", wishHint: "प्रशंसा, इच्छाएँ, चिंताएँ या विचार … (वैकल्पिक)",
    step: (n, of) => `प्रश्न ${n} / ${of}`, back: "वापस", next: "आगे", send: "उत्तर मुहरबंद करें",
    thanks: "बहुत धन्यवाद! आपके उत्तर सामनलैंड को सही दिशा में ले जाने में मेरी मदद करते हैं।", close: "बंद करें", failed: "यह नहीं हुआ। कृपया फिर से प्रयास करें।",
  },
  zh: {
    title: "问卷", ask: "你愿意参加一个关于 Samenland 未来发展的简短问卷吗？",
    sub: "大约只需一分钟，对我帮助很大。", yes: "回答问卷", later: "下次再问我", never: "不再询问",
    qs: [
      { q: "你觉得村庄和建筑的成长速度如何？", a: ["刚刚好——悠闲惬意。", "有点慢——有时等待太久。", "太慢了——我想更快进展。", "甚至可以更慢一些。"] },
      { q: "当你访问村庄时，现在有足够的事情可做吗？", a: ["有，静静观察和规划就足够了。", "我希望每天有 1–2 个小任务或决定。", "我希望有多得多的主动参与方式。"] },
      { q: "与其他玩家一起游戏，最吸引你的是什么？", a: ["共同的道路、贸易和邻里互助。", "友好的比较——谁的村庄更气派？", "我更喜欢独自安静地建设。"] },
      { q: "我接下来应该重点做什么？", a: ["更多村庄生活（动物、节庆、手艺、习俗）。", "王侯宫廷、诏令、差事和骑士头衔。", "更深的经济（商队、行会、加工）。", "更自由的村庄装饰（花园、路牌、装饰）。"] },
    ],
    wish: "对 Samenland，你最在意什么——或者还缺少什么？", wishHint: "称赞、愿望、担忧或想法……（可选）",
    step: (n, of) => `第 ${n} 题，共 ${of} 题`, back: "返回", next: "下一步", send: "封存答案",
    thanks: "非常感谢！你的回答帮助我把 Samenland 引向正确的方向。", close: "关闭", failed: "没有成功，请再试一次。",
  },
  ja: {
    title: "アンケート", ask: "Samenland の今後についての短いアンケートに答えてみませんか？",
    sub: "1 分ほどで終わり、とても助かります。", yes: "回答する", later: "次回また聞いて", never: "今後は聞かないで",
    qs: [
      { q: "村や建物が育つペースをどう感じますか？", a: ["ちょうどいい――ゆったりして心地よい。", "少し遅い――待ち時間が長いことがある。", "かなり遅い――もっと早く進めたい。", "もっと遅くてもいい。"] },
      { q: "村を訪れたとき、今はやることが十分にありますか？", a: ["はい、のんびり眺めて計画するだけで満足。", "毎日 1～2 個の小さな仕事や決断がほしい。", "もっと積極的に関われる要素がほしい。"] },
      { q: "他のプレイヤーとの関わりで一番魅力的なのは？", a: ["共同の道、交易、ご近所の助け合い。", "友好的な比べ合い――どの村が立派か。", "一人で静かに作るほうが好き。"] },
      { q: "次に何に一番力を入れるべきですか？", a: ["村の暮らし（動物、祭り、手仕事、風習）。", "領主の宮廷、布告、使いと騎士の称号。", "より深い経済（荷車、ギルド、加工）。", "村の自由な飾り付け（庭、道標、装飾）。"] },
    ],
    wish: "Samenland で一番大切にしてほしいこと、または足りないものは？", wishHint: "称賛、要望、心配、アイデア…（任意）",
    step: (n, of) => `質問 ${n} / ${of}`, back: "戻る", next: "次へ", send: "回答を封印する",
    thanks: "ありがとうございます！あなたの回答が Samenland を正しい方向へ導く助けになります。", close: "閉じる", failed: "うまくいきませんでした。もう一度お試しください。",
  },
};
