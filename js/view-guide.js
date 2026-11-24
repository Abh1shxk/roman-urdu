/* Sounds guide: how Roman Urdu spellings map to sounds, plus a few grammar basics. */
(function () {
  "use strict";
  const App = window.App;
  App.views = App.views || {};

  function table(head, rows) {
    return '<div class="table-wrap"><table class="guide-table"><thead><tr>' +
      head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + '</tr></thead><tbody>' +
      rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") +
      '</tbody></table></div>';
  }

  App.views.guide = {
    render: function (el) {
      el.innerHTML =
        '<h1>How Roman Urdu sounds</h1>' +
        '<p class="lead">Roman Urdu is Urdu written with English letters, the way people text and post every day. There is no single official spelling, so this app uses the most common, consistent spellings and accepts the usual alternatives in quizzes.</p>' +

        '<h2>Vowels</h2>' +
        table(["Spelling", "Sounds like", "Examples"], [
          ["a", "short <em>uh</em>, as in <i>but</i>", "<b>ab</b> (now), <b>kal</b> (tomorrow), <b>dar</b> (fear)"],
          ["aa", "long <em>aa</em>, as in <i>father</i>", "<b>aap</b> (you), <b>naam</b> (name). At the end of a word it is usually written just <b>a</b>: mer<b>a</b>, achh<b>a</b>"],
          ["i", "short <em>i</em>, as in <i>sit</i>", "<b>dil</b> (heart), <b>din</b> (day)"],
          ["ee", "long <em>ee</em>, as in <i>see</i>", "<b>teen</b> (three), <b>theek</b> (fine). At the end of a word it is usually <b>i</b>: paan<b>i</b>, rot<b>i</b>"],
          ["u", "short <em>u</em>, as in <i>put</i>", "<b>tum</b> (you), <b>khush</b> (happy)"],
          ["oo", "long <em>oo</em>, as in <i>food</i>", "<b>doodh</b> (milk), <b>phool</b> (flower)"],
          ["e", "<em>ay</em>, as in <i>say</i> (without the glide)", "<b>ek</b> (one), <b>mera</b> (my). At the end of a word you'll see <b>e</b> or <b>ay</b>: kais<b>e</b> / kais<b>ay</b>"],
          ["o", "<em>oh</em>, as in <i>go</i>", "<b>dost</b> (friend), <b>do</b> (two)"],
          ["ai", "like the <em>a</em> in <i>cat</i> or <i>hair</i>", "<b>hai</b> (is), <b>main</b> (I), <b>kaise</b> (how)"],
          ["au", "<em>aw</em>, as in <i>saw</i>", "<b>aur</b> (and), <b>nau</b> (nine), <b>kaun</b> (who)"]
        ]) +
        '<div class="callout"><b>Nasal n.</b> An <b>n</b> after a long vowel at the end of a word is usually said through the nose, not fully pronounced: <b>main</b>, <b>haan</b>, <b>nahin</b>, <b>hoon</b>. The "sounds like" hints mark it as <b>(n)</b>.</div>' +

        '<h2>Consonants that work differently</h2>' +
        table(["Spelling", "How to say it", "Examples"], [
          ["kh", "Two sounds! <b>1.</b> Throaty, like Scottish <i>loch</i> or German <i>Bach</i>. <b>2.</b> A <i>k</i> with a puff of breath.", "1: <b>khush</b> (happy), <b>khuda</b> (God)<br>2: <b>khaana</b> (food), <b>dekhna</b> (to see)"],
          ["gh", "Two sounds! <b>1.</b> A soft gargle, like French <i>r</i>. <b>2.</b> A <i>g</i> with a puff of breath.", "1: <b>ghalat</b> (wrong), <b>gham</b> (sorrow)<br>2: <b>ghar</b> (house), <b>ghanta</b> (hour)"],
          ["bh, ph, th, dh, jh, chh", "The <b>h</b> means: add a puff of breath. <b>ph</b> is never <i>f</i>, and <b>th</b> is never the English <i>th</i>.", "<b>bhai</b> (brother), <b>phool</b> (flower), <b>thanda</b> (cold), <b>dhoop</b> (sunshine), <b>mujhe</b> (me), <b>chhota</b> (small)"],
          ["t, d", "Soft: the tongue touches the back of the top teeth.", "<b>tum</b> (you), <b>do</b> (two), <b>das</b> (ten)"],
          ["t, d, r (curled)", "Some t, d and r sounds are said with the tongue curled back. Normal spelling doesn't show this; the hints write them as <b>T</b>, <b>D</b>, <b>R</b>. That flapped R is sometimes spelled <b>d</b>: <b>larka</b> / <b>ladka</b>.", "<b>roti</b> (roh-<b>T</b>ee), <b>anda</b> (un-<b>D</b>aa), <b>larka</b> (lu<b>R</b>-kaa)"],
          ["q", "Like <i>k</i>, but from deep in the throat. Often just written <b>k</b>.", "<b>qalam</b> (pen), <b>waqt</b> (time)"],
          ["w / v", "The same sound in Urdu, between English <i>v</i> and <i>w</i>.", "<b>wahaan</b> / <b>vahaan</b> (there)"],
          ["r", "Tapped with the tongue, and never silent.", "<b>kar</b> (do), <b>sardi</b> (winter)"],
          ["ch, j, sh, z, f", "As in English.", "<b>chaaye</b> (tea), <b>jaana</b> (to go), <b>shaam</b> (evening)"]
        ]) +

        '<h2>Reading the "sounds like" hints</h2>' +
        '<p class="muted">Every word has a hint written in English-style syllables, e.g. <b>mohabbat</b> → <b>mo-hub-but</b>. The symbols are:</p>' +
        table(["Symbol", "Meaning"], [
          ["uh · aa", "short a (but) · long a (father)"],
          ["i · ee", "short i (sit) · long ee (see)"],
          ["u · oo", "short u (put) · long oo (food)"],
          ["ay · oh", "e as in say · o as in go"],
          ["ae · aw", "ai as in cat / hair · au as in saw"],
          ["(n)", "say the vowel through your nose"],
          ["k'h, g'h, t'h, p'h, b'h, d'h, j'h", "the letter plus a puff of breath"],
          ["chh", "ch plus a puff of breath"],
          ["T · D · R", "tongue curled back to the roof of the mouth"],
          ["kh · gh · q", "throaty sounds: loch · gargle · deep k"]
        ]) +

        '<h2>Grammar in two minutes</h2>' +
        table(["Idea", "Example"], [
          ["The verb goes last (subject, object, verb).", "<b>Main paani peeta hoon.</b> = I water drink am → I drink water."],
          ["Masculine words often end in <b>-a</b>, feminine in <b>-i</b>. Describing words and verbs follow.", "<b>achha larka</b> (good boy) · <b>achhi larki</b> (good girl)"],
          ["A man says <b>karta / bolta</b>; a woman says <b>karti / bolti</b>.", "<b>Main Urdu seekh raha hoon</b> (m) · <b>seekh rahi hoon</b> (f)"],
          ["Dictionary verbs end in <b>-na</b>. Drop it for the stem.", "<b>khaana</b> (to eat) → <b>khao!</b> (eat!) · <b>aap khaaiye</b> (please eat)"],
          ["Polite <b>aap</b> takes <b>-iye</b>; casual <b>tum</b> takes <b>-o</b>.", "<b>baithiye</b> / <b>baitho</b> (sit) · <b>aaiye</b> / <b>aao</b> (come)"],
          ["Put <b>kya</b> in front to make a yes/no question.", "<b>Kya aap theek hain?</b> = Are you okay?"],
          ["Little words for <i>am / is / are / was</i>.", "<b>hoon</b> (am) · <b>hai</b> (is) · <b>hain</b> (are) · <b>tha / thi</b> (was)"],
          ["Little words that come <i>after</i> the noun.", "<b>ghar mein</b> (in the house) · <b>mez par</b> (on the table) · <b>Ali ka</b> (Ali's)"]
        ]) +

        '<h2>Same word, different spellings</h2>' +
        '<p class="muted">You will see all of these online. Quizzes accept them, along with small variations like doubled letters and aa/a, ee/i, oo/u.</p>' +
        table(["This app", "Also written"], [
          ["bahut", "bohat, bohot, bahot"], ["mohabbat", "muhabbat, mohabat"], ["achha", "acha, accha"],
          ["nahin", "nahi, nai"], ["theek", "thik"], ["chaaye", "chai, chaye"], ["larka", "ladka"],
          ["khuda haafiz", "khuda hafiz"], ["shukriya", "shukria"], ["kaise", "kaisay, kese"]
        ]) +
        '<div class="row" style="margin-top:22px"><button class="btn btn-primary btn-lg" type="button" id="g-start">Start with greetings →</button></div>';
      el.querySelector("#g-start").addEventListener("click", function () { App.go("cards-greetings"); });
    }
  };
})();
