/**
 * OmKarmyog - Grand Master Kundali Engine v2.2
 * + History Save (localStorage, last 10)
 * + WhatsApp Share as Image (canvas → blob → share)
 */

class KundaliGrandMaster {
    constructor(db) {
        this.db = db;
        this.fullRashi = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];
        this.phoneticMap = {
            "प्र":"पा","प्री":"पी","सं":"सा","स्मि":"सा",
            "वै":"वे","श्र":"शे","सत":"सा","वस":"वा",
            "मो":"मो","भा":"भा","रा":"रा","पू":"पू",
            "स्व":"स्व","ज्य":"ज","श्व":"श","क्ष":"क",
            "ज्ञ":"ज","त्र":"त","द्व":"द","न्य":"न"
        };
    }

    getFirstChar(name) {
        let n = name.trim();
        for (let key of Object.keys(this.phoneticMap).sort((a,b)=>b.length-a.length))
            if (n.startsWith(key)) return this.phoneticMap[key];
        return n.substring(0,2).normalize();
    }

    getDetails(name) {
        let char = this.getFirstChar(name);
        for (let nak of this.db.nakshatras) {
            let pada = nak.padas.find(p=>p.char===char) ||
                       nak.padas.find(p=>p.char===char.charAt(0));
            if (pada) return {
                ...pada,
                nakID: nak.id,
                yoni: nak.yoni,
                gana: nak.gana,
                nadi: nak.nadi,
                nakName: nak.name,
                charan: pada.char
            };
        }
        return null;
    }

    calculateTara(vID, bID) {
        const dist = (f,t)=>(t-f+27)%27+1;
        const taraNum = (d)=>(d%9===0?9:d%9);
        let t1 = taraNum(dist(vID,bID));
        let t2 = taraNum(dist(bID,vID));
        const ashubh = [3,5,7];
        if (!ashubh.includes(t1)&&!ashubh.includes(t2)) return 3;
        if (ashubh.includes(t1)&&ashubh.includes(t2)) return 0;
        return 1.5;
    }

    calculateBhakoot(vRashi, bRashi) {
        const bhakoot = this.db.matrices.bhakoot_logic;
        const pair = `${vRashi}-${bRashi}`;
        const reversePair = `${bRashi}-${vRashi}`;
        if (bhakoot.ashubha_neshta.includes(pair)||bhakoot.ashubha_neshta.includes(reversePair))
            return {pts:0,bonus:0,status:"Neshta"};
        if (bhakoot.shubha_bonus.includes(pair)||bhakoot.shubha_bonus.includes(reversePair))
            return {pts:0,bonus:3,status:"Shubha"};
        const vIdx = this.fullRashi.indexOf(vRashi);
        const bIdx = this.fullRashi.indexOf(bRashi);
        if (vIdx===-1||bIdx===-1) return {pts:0,bonus:0,status:"Neutral"};
        const diff = Math.abs(vIdx-bIdx);
        if ([0,2,3,6,9,10].includes(diff)) return {pts:7,bonus:0,status:"Good"};
        return {pts:0,bonus:0,status:"Neutral"};
    }

    match(vadhuName, varaName) {
        const v = this.getDetails(vadhuName);
        const b = this.getDetails(varaName);
        if (!v||!b) return {error:"नावावरून नक्षत्र सापडले नाही. कृपया नावाचे पहिले अक्षर स्पष्ट/योग्य टाका."};

        const isRule5 =
            (v.nakName===b.nakName && v.charan!==b.charan) ||
            (v.rashi===b.rashi && v.nakName!==b.nakName) ||
            (v.rashi!==b.rashi && v.nakName===b.nakName);

        if (isRule5) {
            return {
                finalScore:36,
                remarks:["एक नक्षत्र भिन्न चरण, एक राशि भिन्न नक्षत्र किंवा भिन्न राशि एक नक्षत्र असल्यास ३६ गुण समजावे."],
                scoreDetails:{varna:1,vashya:2,tara:3,yoni:4,maitri:5,gana:6,bhakoot:7,nadi:8},
                vadhuDetails:v,
                varaDetails:b
            };
        }

        const m = this.db.matrices;
        const varna   = m.varna[b.varna]?.[v.varna] ?? 0;
        const vashya  = m.vashya[v.vashya]?.[b.vashya] ?? 0;
        const tara    = this.calculateTara(v.nakID, b.nakID);
        const yoniIdx_v = m.yoni.order.indexOf(v.yoni);
        const yoniIdx_b = m.yoni.order.indexOf(b.yoni);
        const yoni    = (yoniIdx_v!==-1&&yoniIdx_b!==-1) ? m.yoni.values[yoniIdx_v][yoniIdx_b] : 0;
        const maitri  = m.graha_maitri.points[m.graha_maitri.lords[v.rashi]]?.[m.graha_maitri.lords[b.rashi]] ?? 0;
        const ganaIdx_v = m.gana.order.indexOf(v.gana);
        const ganaIdx_b = m.gana.order.indexOf(b.gana);
        const gana    = (ganaIdx_v!==-1&&ganaIdx_b!==-1) ? m.gana.matrix[ganaIdx_v][ganaIdx_b] : 0;
        const bRes    = this.calculateBhakoot(v.rashi, b.rashi);
        const nadi    = (v.nadi===b.nadi) ? 0 : 8;

        const pureTotal  = varna+vashya+tara+yoni+maitri+gana+bRes.pts+nadi;
        const finalScore = pureTotal+bRes.bonus;

        let remarks = [];
        if (v.gana==="राक्षस"&&b.gana==="मनुष्य"&&finalScore>=18)
            remarks.push("वधू राक्षस गणाची व वर मनुष्य गणाचा असून जर (वश्य, तारा, योनि, ग्रहमैत्री, कूट, नाडी) हे शुभ असता विवाह कल्याणप्रद होतो.");
        if (bRes.status==="Neshta") remarks.push("मृत्यू षडाष्टक दोष");
        if (bRes.status==="Shubha") remarks.push("✅ शुभ भकूट");
        if (nadi===0) remarks.push("एक नाडी दोष येतो");

        return {
            finalScore,
            remarks,
            scoreDetails:{varna,vashya,tara,yoni,maitri,gana,bhakoot:bRes.pts+bRes.bonus,nadi},
            vadhuDetails:v,
            varaDetails:b
        };
    }
}

// ─────────────────────────────────────────────
// HISTORY  (localStorage, max 10 entries)
// ─────────────────────────────────────────────
const HISTORY_KEY = 'omk_history';
const MAX_HISTORY = 10;

function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { return []; }
}

function saveToHistory(entry) {
    let hist = loadHistory();
    // duplicate check (same two names)
    hist = hist.filter(h => !(h.groom===entry.groom && h.bride===entry.bride));
    hist.unshift(entry);
    if (hist.length > MAX_HISTORY) hist = hist.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    renderHistory();
}

function deleteHistory(index) {
    let hist = loadHistory();
    hist.splice(index, 1);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    renderHistory();
}

function clearAllHistory() {
    if (!confirm('सर्व इतिहास मिटवायचा?')) return;
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
}

function verdictInfo(score) {
    if (score>=28) return ['अत्यंत उत्तम मिलन','v-excellent','#7ef09a'];
    if (score>=21) return ['उत्तम मिलन','v-good','#e8c87a'];
    if (score>=18) return ['सामान्य मिलन','v-average','#e8c87a'];
    return ['विवाह अशुभ','v-poor','#f08080'];
}

function renderHistory() {
    const hist = loadHistory();
    const container = document.getElementById('historyList');
    const section   = document.getElementById('historySection');
    if (!container) return;

    if (!hist.length) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    container.innerHTML = hist.map((h,i) => {
        const [vText,,vColor] = verdictInfo(h.score);
        return `
        <div class="hist-item" id="hist-${i}">
          <div class="hist-names">
            <span class="hist-groom">🪔 ${h.groom}</span>
            <span class="hist-sep">×</span>
            <span class="hist-bride">🪷 ${h.bride}</span>
          </div>
          <div class="hist-meta">
            <span class="hist-score" style="color:${vColor}">${h.score}/३६</span>
            <span class="hist-verdict">${vText}</span>
            <span class="hist-date">${h.date}</span>
          </div>
          <div class="hist-actions">
            <button class="hist-btn" onclick="loadHistoryEntry(${i})">पुन्हा बघा</button>
            <button class="hist-btn hist-del" onclick="deleteHistory(${i})">✕</button>
          </div>
        </div>`;
    }).join('');
}

function loadHistoryEntry(index) {
    const hist = loadHistory();
    const h = hist[index];
    if (!h) return;
    // fill inputs
    document.getElementById('groomName').value = h.groom;
    document.getElementById('brideName').value = h.bride;
    // trigger calculate after a tick
    setTimeout(() => {
        if (typeof calculate === 'function') calculate();
    }, 80);
    window.scrollTo({top:0, behavior:'smooth'});
}

// ─────────────────────────────────────────────
// WHATSAPP SHARE  (canvas → image → share API / fallback URL)
// ─────────────────────────────────────────────
async function shareOnWhatsApp() {
    if (!window._lastShareCanvas) { alert("आधी गुण मोजा!"); return; }

    const canvas  = window._lastShareCanvas;
    const groom   = window._lastShareGroom || '';
    const bride   = window._lastShareBride || '';
    const score   = window._lastShareScore || 0;
    const [verdict] = verdictInfo(score);
    const text    = `🪔 ${groom} × 🪷 ${bride}\n✨ अष्टकूट गुण: ${score}/३६\n🎯 ${verdict}\n\nOmKarmyog वर तुमचेही गुण मोजा!`;

    // Try native share (mobile)
    if (navigator.canShare) {
        canvas.toBlob(async blob => {
            const file = new File([blob], 'GunMilan.png', {type:'image/png'});
            if (navigator.canShare({files:[file]})) {
                try {
                    await navigator.share({files:[file], title:'गुण मिलन', text});
                    return;
                } catch(e) { /* fallback */ }
            }
            // fallback: open WhatsApp with text only
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }, 'image/png');
    } else {
        // Desktop fallback: download image + open WhatsApp
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href    = url;
            a.download = `GunMilan_${groom}_${bride}.png`;
            a.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
        setTimeout(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }, 800);
    }
}

// ─────────────────────────────────────────────
// ENGINE INIT + FETCH
// ─────────────────────────────────────────────
let engine;

fetch('data.json')
    .then(r => { if (!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
    .then(data => {
        engine = new KundaliGrandMaster(data);
        console.log("✅ डेटा यशस्वीरित्या लोड झाला.");
        renderHistory();
    })
    .catch(err => {
        console.error("❌ डेटा लोड चूक:", err);
        alert("data.json फाईल सापडली नाही किंवा चुकीची आहे!");
    });
