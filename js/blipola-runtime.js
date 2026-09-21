(function () {
  const DAY = 86400000;
  const LABELS = {
    letters:"Letters", numbers:"Numbers", words:"English", chinese:"Chinese",
    spanish:"Spanish", math:"Math", science:"Science", patterns:"Patterns",
    comparing:"Comparing", positions:"Positions", measurement:"Measuring",
    time:"Time", money:"Money", onemoreless:"More or Less", rhyming:"Rhyming",
    sightwords:"Sight Words", make10:"Make 10", decompose:"Decompose",
    teennumbers:"Teen Numbers", sortclassify:"Sort & Classify",
    shapes3d:"3D Shapes", printconcepts:"Print Concepts",
    begendsounds:"Sounds", sentences:"Sentences", prepositions:"Prepositions",
    sortcategory:"Categories"
  };

  function dayKey(d = new Date()) {
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
  }

  function create(progress) {
    const listeners = {};
    let state = "idle";

    const on = (type, fn) => {
      (listeners[type] ||= []).push(fn);
      return () => { listeners[type] = (listeners[type] || []).filter(x => x !== fn); };
    };

    const emit = event => {
      (listeners[event.type] || []).forEach(fn => fn(event));
      (listeners["*"] || []).forEach(fn => fn(event));
      window.dispatchEvent(new CustomEvent("blipola:" + event.type, { detail: event }));
    };

    const setState = (next, detail = {}) => {
      state = next;
      emit({ type:"buddy-state", state:next, ...detail });
      return state;
    };

    const itemHistory = (skill, item) => progress.__blipola?.skills?.[skill]?.[String(item)] || null;
    const mastery = (skill, item) => {
      const x = itemHistory(skill, item);
      return x?.attempts ? x.correct / x.attempts : 0;
    };

    function ensure(skill, item) {
      progress.__blipola ||= { skills:{}, missions:{}, rewards:{xp:0} };
      progress.__blipola.skills[skill] ||= {};
      return progress.__blipola.skills[skill][String(item)] ||= {
        attempts:0, correct:0, wrong:0, firstTry:0, recentErrors:0,
        correctStreak:0, lastSeen:null, nextReview:null
      };
    }

    function recommendation(skill, item) {
      const x = itemHistory(skill, item);
      if (!x) return { action:"NEW", difficulty:"gentle", reason:"This is a new skill." };
      if (x.nextReview && Date.parse(x.nextReview) <= Date.now())
        return { action:"REVIEW", difficulty:"steady", reason:"This is a good time to remember it." };
      const m = mastery(skill,item);
      if (x.recentErrors > 0 && m < .7)
        return { action:"HINT", difficulty:"gentle", reason:"Let's practice a tricky part." };
      if (m >= .9)
        return { action:"CHALLENGE", difficulty:"stretch", reason:"You're ready to stretch your thinking." };
      return { action:"PRACTICE", difficulty:m < .5 ? "gentle" : "steady", reason:"A little more practice will help." };
    }

    function startQuestion(q) {
      const skill = q.sourceKey || q.key || q.category || "unknown";
      const item = String(q.itemId ?? q.answer ?? "");
      const context = {
        skill, item, level:q.sourceLevel || q.level || "L1",
        question:q.speakText || LABELS[skill] || "Let's learn!",
        choices:(q.choices || []).map(c => c.id ?? c),
        answer:item, hostQuestion:q
      };
      setState("thinking", { context });
      emit({ type:"question-started", context });
      return context;
    }

    function hint(context, wrongAttempts = 0) {
      const level = Math.min(4, Math.max(1, Number(wrongAttempts) || 1));
      const messages = [
        "Take another look. What do you notice?",
        "Can you spot one clue?",
        "Let's do one small step together.",
        "Let's solve one tiny part together."
      ];
      setState("hint", { context, level });
      const message = messages[level - 1];
      emit({ type:"hint-requested", context, hint:message, level });
      return message;
    }

    function explain(context) {
      setState("thinking", { context });
      return "Let's break the idea into one small step.";
    }

    function complete(context, outcome) {
      const x = ensure(context.skill, context.item);
      const correct = !!outcome.correct;
      x.attempts += 1;
      x.lastSeen = new Date().toISOString();

      if (correct) {
        x.correct += 1;
        x.correctStreak += 1;
        x.recentErrors = 0;
        if (outcome.firstTry) x.firstTry += 1;
        const days = [1,2,4,7,14][Math.min(4, Math.max(0,x.correctStreak-1))];
        x.nextReview = new Date(Date.now() + days * DAY).toISOString();
      } else {
        x.wrong += 1;
        x.recentErrors = Math.min(5, x.recentErrors + 1);
        x.correctStreak = 0;
        x.nextReview = new Date(Date.now()).toISOString();
      }

      progress.__blipola.rewards.xp += correct ? (outcome.firstTry ? 10 : 5) : 0;
      progress.__blipola.lastActivity = Date.now();
      if (typeof saveProgress === "function") saveProgress();

      setState(correct ? "celebrate" : "retry", { outcome, context });
      emit({ type:"learning-complete", context, outcome, item:x });
      return { context, outcome, item:x };
    }

    function dailyAdventure() {
      const all = [];
      for (const [skill, items] of Object.entries(progress.__blipola?.skills || {})) {
        for (const [item, x] of Object.entries(items || {})) {
          if (x.nextReview && Date.parse(x.nextReview) <= Date.now())
            all.push({ skill, item, action:"REVIEW", mastery:x.attempts ? x.correct/x.attempts : 0 });
          else if (x.recentErrors > 0)
            all.push({ skill, item, action:"RETRY", mastery:x.attempts ? x.correct/x.attempts : 0 });
        }
      }
      all.sort((a,b) => a.mastery-b.mastery);
      if (all[0]) return {
        ...all[0],
        title:all[0].action === "REVIEW" ? "Remember" : "Try Again",
        reason:all[0].action === "REVIEW" ? "A review is ready." : "Let's revisit a tricky one."
      };
      return { action:"NEW", skill:"letters", item:"A", title:"Discover", reason:"Let's discover something new." };
    }

    function dailySummary() {
      const d = dayKey();
      progress.__blipola.missions ||= {};
      const done = progress.__blipola.missions[d] || {};
      return {
        missions:[
          {id:"learn",title:"Learn",done:!!done.learn},
          {id:"think",title:"Think",done:!!done.think},
          {id:"remember",title:"Remember",done:!!done.remember}
        ]
      };
    }

    function completeMission(id) {
      const d = dayKey();
      progress.__blipola.missions ||= {};
      progress.__blipola.missions[d] ||= {};
      if (progress.__blipola.missions[d][id]) return false;
      progress.__blipola.missions[d][id] = true;
      if (typeof saveProgress === "function") saveProgress();
      return true;
    }

    return {
      get state(){ return state; },
      on, emit, startQuestion, hint, explain, complete,
      recommend:recommendation, dailyAdventure, dailySummary, completeMission,
      label:key => LABELS[key] || key
    };
  }

  window.BlipolaClassroom = { create };
})();
