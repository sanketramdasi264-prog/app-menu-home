/**
 * OmKarmyog - Grand Master Kundali Engine v3.0
 * सर्व नियम updated
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

        // नियम २: जन्मनक्षत्र दोष नक्षत्रे
        this.janmaNakshatraDosh = {
            "आश्लेषा":  [1, 2, 3, 4],   // सर्व चरण
            "मूळ":      [1, 2, 3, 4],   // सर्व चरण
            "ज्येष्ठा": [1, 2, 3, 4],   // सर्व चरण
            "विशाखा":   [4]             // फक्त ४था चरण
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

    // नियम २: जन्मनक्षत्र दोष तपासणे
    checkJanmaNakshatraDosh(details) {
        if (!details) return false;
        const nakName = details.nakName;
        if (!this.janmaNakshatraDosh[nakName]) return false;

        // चरण index काढणे (1-based)
        const nak = this.db.nakshatras.find(n => n.id === details.nakID);
        if (!nak) return false;
        const charanIdx = nak.padas.findIndex(p => p.char === details.charan);
        const charanNum = charanIdx + 1; // 1-based

        return this.janmaNakshatraDosh[nakName].includes(charanNum);
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
            return {pts:0, bonus:0, status:"Neshta"};
        if (bhakoot.shubha_bonus.includes(pair)||bhakoot.shubha_bonus.includes(reversePair))
            return {pts:0, bonus:3, status:"Shubha"};
        const vIdx = this.fullRashi.indexOf(vRashi);
        const bIdx = this.fullRashi.indexOf(bRashi);
        if (vIdx===-1||bIdx===-1) return {pts:0, bonus:0, status:"Neutral"};
        const diff = Math.abs(vIdx-bIdx);
        if ([0,2,3,6,9,10].includes(diff)) return {pts:7, bonus:0, status:"Good"};
        return {pts:0, bonus:0, status:"Neutral"};
    }

    match(vadhuName, varaName) {
        const v = this.getDetails(vadhuName);
        const b = this.getDetails(varaName);
        if (!v||!b) return {
            error:"नावावरून नक्षत्र सापडले नाही. कृपया नावाचे पहिले अक्षर स्पष्ट/योग्य टाका."
        };

        // ══════════════════════════════════════════
        // नियम १-A: Same नक्षत्र + Same चरण + Same राशी
        // → 0 गुण + एक चरण दोष
        // ══════════════════════════════════════════
        if (v.nakName === b.nakName &&
            v.charan  === b.charan  &&
            v.rashi   === b.rashi) {
            return {
                finalScore: 0,
                displayScore: 0,
                remarks: ["एक चरण दोष — दोघांचे नक्षत्र, चरण व राशी सर्व समान आहे. विवाह अशुभ."],
                doshaList: ["ekCharan"],
                scoreDetails: {varna:0,vashya:0,tara:0,yoni:0,maitri:0,gana:0,bhakoot:0,nadi:0},
                vadhuDetails: v,
                varaDetails:  b
            };
        }

        // ══════════════════════════════════════════
        // नियम १-B: 36 गुण cases
        // ══════════════════════════════════════════
        let rule36 = null;

        if (v.nakName === b.nakName && v.charan !== b.charan) {
            rule36 = "एक नक्षत्र भिन्न चरण असल्यामुळे ३६ गुण समजावे.";
        } else if (v.rashi === b.rashi && v.nakName !== b.nakName) {
            rule36 = "एक राशी भिन्न नक्षत्र असल्यामुळे ३६ गुण समजावे.";
        } else if (v.nakName === b.nakName && v.rashi !== b.rashi) {
            rule36 = "भिन्न राशी एक नक्षत्र असल्यामुळे ३६ गुण समजावे.";
        }

        if (rule36) {
            return {
                finalScore: 36,
                displayScore: 36,
                remarks: [rule36],
                doshaList: [],
                scoreDetails: {varna:1,vashya:2,tara:3,yoni:4,maitri:5,gana:6,bhakoot:7,nadi:8},
                vadhuDetails: v,
                varaDetails:  b
            };
        }

        // ══════════════════════════════════════════
        // सामान्य अष्टकूट calculation
        // ══════════════════════════════════════════
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
        const finalScore = pureTotal + bRes.bonus;

        // ══════════════════════════════════════════
        // दोष यादी तयार करणे
        // ══════════════════════════════════════════
        let remarks   = [];
        let doshaList = [];

        // नियम २: जन्मनक्षत्र दोष
        const vJanma = this.checkJanmaNakshatraDosh(v);
        const bJanma = this.checkJanmaNakshatraDosh(b);
        if (vJanma || bJanma) {
            let who = [];
            if (bJanma) who.push(`वर (${b.nakName}${b.nakName==="विशाखा"?" ४था चरण":""})`);
            if (vJanma) who.push(`वधू (${v.nakName}${v.nakName==="विशाखा"?" ४था चरण":""})`);
            remarks.push(`जन्मनक्षत्र दोष — ${who.join(" व ")}.`);
            doshaList.push("janmaNakshatr");
        }

        // नियम ३: गण गुण 0 → मनुष्य राक्षस दोष
        if (gana === 0) {
            remarks.push("मनुष्य राक्षस दोष — गण मिलन शून्य आहे.");
            doshaList.push("gana");
        }

        // नियम ४: मृत्यूषडाष्टक दोष (display 0, actual calculate)
        if (bRes.status === "Neshta") {
            remarks.push("मृत्यूषडाष्टक दोष — भकूट नेष्ट संबंध आढळला.");
            doshaList.push("mrutyuShadashtak");
        }

        // शुभ भकूट
        if (bRes.status === "Shubha") {
            remarks.push("✅ शुभ भकूट — ३ बोनस गुण मिळाले.");
        }

        // नाडी दोष
        if (nadi === 0) {
            remarks.push("एक नाडी दोष — दोघांची नाडी समान आहे.");
            doshaList.push("nadi");
        }

        // नियम ४: मृत्यूषडाष्टक असल्यास display 0
        const displayScore = doshaList.includes("mrutyuShadashtak") ? 0 : finalScore;

        return {
            finalScore,       // actual calculated score
            displayScore,     // screen वर दाखवायचा score
            remarks,
            doshaList,
            scoreDetails: {varna,vashya,tara,yoni,maitri,gana,bhakoot:bRes.pts+bRes.bonus,nadi},
            vadhuDetails: v,
            varaDetails:  b
        };
    }
}

// ─────────────────────────────────────────────
// ENGINE INIT
// ─────────────────────────────────────────────
let engine;

fetch('data.json')
    .then(r => { if (!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
    .then(data => {
        engine = new KundaliGrandMaster(data);
        console.log("✅ OmKarmyog Engine v3.0 लोड झाला.");
    })
    .catch(err => {
        console.error("❌ डेटा लोड चूक:", err);
        alert("data.json फाईल सापडली नाही किंवा चुकीची आहे!");
    });
