/**
 * OmKarmyog - Grand Master Kundali Engine v2.1 (Fixed)
 * GitHub Pages Deployment Version
 */

class KundaliGrandMaster {
    constructor(db) {
        this.db = db;
        this.fullRashi = ["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"];

        // FIX: phoneticMap expanded — अधिक नावे handle होतील
        this.phoneticMap = {
            "प्र": "पा", "प्री": "पी", "सं": "सा", "स्मि": "सा",
            "वै": "वे", "श्र": "शे", "सत": "सा", "वस": "वा",
            "मो": "मो", "भा": "भा", "रा": "रा", "पू": "पू",
            "स्व": "स्व", "ज्य": "ज", "श्व": "श", "क्ष": "क",
            "ज्ञ": "ज", "त्र": "त", "द्व": "द", "न्य": "न"
        };
    }

    // FIX: नावावरून अक्षर काढण्याची सुधारित पद्धत
    getFirstChar(name) {
        let n = name.trim();
        // तीन अक्षरी phonetic map आधी तपासा
        for (let key of Object.keys(this.phoneticMap).sort((a, b) => b.length - a.length)) {
            if (n.startsWith(key)) return this.phoneticMap[key];
        }
        // पहिले 2 unicode chars (Devanagari matras सोबत)
        return n.substring(0, 2).normalize();
    }

    getDetails(name) {
        let char = this.getFirstChar(name);

        for (let nak of this.db.nakshatras) {
            // दोन-अक्षरी char प्रथम तपासा, मग एकच अक्षर
            let pada = nak.padas.find(p => p.char === char) ||
                       nak.padas.find(p => p.char === char.charAt(0));
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
        const dist = (f, t) => (t - f + 27) % 27 + 1;
        const taraNum = (d) => (d % 9 === 0 ? 9 : d % 9);
        let t1 = taraNum(dist(vID, bID));
        let t2 = taraNum(dist(bID, vID));
        const ashubh = [3, 5, 7];
        if (!ashubh.includes(t1) && !ashubh.includes(t2)) return 3;
        if (ashubh.includes(t1) && ashubh.includes(t2)) return 0;
        return 1.5;
    }

    // FIX: Bhakoot आता पूर्ण Rashi नावाने तपासतो — shortcode ambiguity नाही
    calculateBhakoot(vRashi, bRashi) {
        const bhakoot = this.db.matrices.bhakoot_logic;
        const pair = `${vRashi}-${bRashi}`;
        const reversePair = `${bRashi}-${vRashi}`;

        // FIX: आधी ashubha_neshta तपासा, मग shubha_bonus — conflict नाही आता
        if (bhakoot.ashubha_neshta.includes(pair) || bhakoot.ashubha_neshta.includes(reversePair)) {
            return { pts: 0, bonus: 0, status: "Neshta" };
        }
        if (bhakoot.shubha_bonus.includes(pair) || bhakoot.shubha_bonus.includes(reversePair)) {
            return { pts: 0, bonus: 3, status: "Shubha" };
        }

        // FIX: diff आता वापरतो — index-based calculation
        const vIdx = this.fullRashi.indexOf(vRashi);
        const bIdx = this.fullRashi.indexOf(bRashi);

        if (vIdx === -1 || bIdx === -1) return { pts: 0, bonus: 0, status: "Neutral" };

        const diff = Math.abs(vIdx - bIdx);
        // 1-7, 2-12, 3-11, 4-10 शुभ bhakoot positions
        if ([0, 1, 2, 3, 6, 9, 10, 11].includes(diff)) {
            return { pts: 7, bonus: 0, status: "Good" };
        }
        return { pts: 0, bonus: 0, status: "Neutral" };
    }

    match(vadhuName, varaName) {
        const v = this.getDetails(vadhuName);
        const b = this.getDetails(varaName);
        if (!v || !b) return {
            error: "नावावरून नक्षत्र सापडले नाही. कृपया नावाचे पहिले अक्षर स्पष्ट टाका."
        };

        // नियम ५: एकच नक्षत्र, वेगळा चरण
        if (v.nakName === b.nakName && v.charan !== b.charan) {
            return {
                finalScore: 36,
                remarks: ["नियम ५: एक नक्षत्र भिन्न चरण - ३६ गुण (पूर्ण मिलन)."],
                scoreDetails: {},
                vadhuDetails: v,
                varaDetails: b
            };
        }

        const m = this.db.matrices;

        const varna   = m.varna[v.varna]?.[b.varna] ?? 0;
        const vashya  = m.vashya[v.vashya]?.[b.vashya] ?? 0;
        const tara    = this.calculateTara(v.nakID, b.nakID);
        const yoniIdx_v = m.yoni.order.indexOf(v.yoni);
        const yoniIdx_b = m.yoni.order.indexOf(b.yoni);
        const yoni    = (yoniIdx_v !== -1 && yoniIdx_b !== -1) ? m.yoni.values[yoniIdx_v][yoniIdx_b] : 0;
        const maitri  = m.graha_maitri.points[m.graha_maitri.lords[v.rashi]]?.[m.graha_maitri.lords[b.rashi]] ?? 0;
        const ganaIdx_v = m.gana.order.indexOf(v.gana);
        const ganaIdx_b = m.gana.order.indexOf(b.gana);
        const gana    = (ganaIdx_v !== -1 && ganaIdx_b !== -1) ? m.gana.matrix[ganaIdx_v][ganaIdx_b] : 0;
        const bRes    = this.calculateBhakoot(v.rashi, b.rashi);
        const nadi    = (v.nadi === b.nadi) ? 0 : 8;

        const pureTotal  = varna + vashya + tara + yoni + maitri + gana + bRes.pts + nadi;
        const finalScore = pureTotal + bRes.bonus;

        let remarks = [];
        if (v.gana === "राक्षस" && b.gana === "मनुष्य" && finalScore >= 18) {
            remarks.push("नियम ४: गण सवलत - विवाह कल्याणप्रद.");
        }
        if (bRes.status === "Neshta") {
            remarks.push("⚠️ इशारा: नेष्ट भकूट संबंध आढळला!");
        }
        if (bRes.status === "Shubha") {
            remarks.push("✅ विशेष: शुभ भकूट - ३ बोनस गुण मिळाले.");
        }
        if (nadi === 0) {
            remarks.push("⚠️ इशारा: नाडी दोष आढळला (एकच नाडी)!");
        }

        return {
            finalScore,
            remarks,
            scoreDetails: { varna, vashya, tara, yoni, maitri, gana, bhakoot: bRes.pts + bRes.bonus, nadi },
            vadhuDetails: v,
            varaDetails: b
        };
    }
}

// --- इंजिन सुरू करणे आणि डेटा लोड करणे ---
let engine;

fetch('data.json')
    .then(response => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
    })
    .then(data => {
        engine = new KundaliGrandMaster(data);
        console.log("✅ डेटा यशस्वीरित्या लोड झाला.");
    })
    .catch(error => {
        console.error("❌ डेटा लोड चूक:", error);
        alert("data.json फाईल सापडली नाही किंवा चुकीची आहे!");
    });

document.getElementById('calculateBtn').addEventListener('click', () => {
    if (!engine) {
        alert("सिस्टिम लोड होत आहे, कृपया थोडा वेळ थांबा...");
        return;
    }

    const bride = document.getElementById('brideName').value.trim();
    const groom = document.getElementById('groomName').value.trim();

    if (!bride || !groom) {
        alert("कृपया वधू आणि वराचे नाव टाका!");
        return;
    }

    const res = engine.match(bride, groom);
    const resultArea = document.getElementById('resultArea');

    if (res.error) {
        alert(res.error);
        return;
    }

    resultArea.style.display = "block";
    document.getElementById('finalScore').innerText = res.finalScore;

    // नक्षत्र माहिती दाखवा (optional — HTML मध्ये हे elements असतील तर)
    const vadhuInfo = document.getElementById('vadhuInfo');
    const varaInfo  = document.getElementById('varaInfo');
    if (vadhuInfo) vadhuInfo.innerText = `${res.vadhuDetails.nakName} (${res.vadhuDetails.charan}) - ${res.vadhuDetails.rashi}`;
    if (varaInfo)  varaInfo.innerText  = `${res.varaDetails.nakName} (${res.varaDetails.charan}) - ${res.varaDetails.rashi}`;

    // गुण तक्ता
    const labels = {
        varna:   "वर्ण (१)",
        vashya:  "वश्य (२)",
        tara:    "तारा (३)",
        yoni:    "योनी (४)",
        maitri:  "ग्रहमैत्री (५)",
        gana:    "गण (६)",
        bhakoot: "भकूट (७)",
        nadi:    "नाडी (८)"
    };

    let tableHTML = "";
    let total = 0;
    for (let key in res.scoreDetails) {
        const val = res.scoreDetails[key];
        total += val;
        tableHTML += `<tr><td>${labels[key]}</td><td>${val}</td></tr>`;
    }
    tableHTML += `<tr style="font-weight:bold"><td>एकूण</td><td>${res.finalScore}</td></tr>`;
    document.getElementById('scoreTable').innerHTML = tableHTML;

    // शेरे
    document.getElementById('remarks').innerHTML =
        res.remarks.length > 0
            ? res.remarks.map(r => `<p>${r}</p>`).join('')
            : "<p>✅ कोणताही विशेष दोष आढळला नाही.</p>";
});
