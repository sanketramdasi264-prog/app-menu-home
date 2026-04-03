/**
 * OmKarmyog - Grand Master Kundali Engine v2.0
 * GitHub Pages Deployment Version
 */

class KundaliGrandMaster {
    constructor(db) {
        this.db = db;
        this.rashiShort = ["मे", "वृ", "मि", "कॅ", "सिं", "कं", "तु", "वृ", "ध", "म", "कु", "मी"];
        this.fullRashi = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"];
        this.phoneticMap = { "प्र": "पा", "प्री": "पी", "सं": "सा", "स्मि": "सा", "वै": "वे", "श्र": "शे", "सत": "सा", "वस": "वा", "ल": "ला", "मो": "मा", "भा": "भा", "रा": "रा", "पू": "पू" };
    }

    getDetails(name) {
        let n = name.trim();
        let firstTwo = n.substring(0, 2);
        let char = this.phoneticMap[firstTwo] || n.charAt(0);
        
        for (let nak of this.db.nakshatras) {
            let pada = nak.padas.find(p => p.char === char);
            if (pada) return { ...pada, nakID: nak.id, yoni: nak.yoni, gana: nak.gana, nadi: nak.nadi, nakName: nak.name, charan: pada.char };
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

    calculateBhakoot(vRashi, bRashi) {
        const vIdx = this.fullRashi.indexOf(vRashi);
        const bIdx = this.fullRashi.indexOf(bRashi);
        const diff = Math.abs(vIdx - bIdx);
        const pair = `${this.rashiShort[vIdx]}-${this.rashiShort[bIdx]}`;
        const reversePair = `${this.rashiShort[bIdx]}-${this.rashiShort[vIdx]}`;

        if (this.db.matrices.bhakoot_logic.ashubha_neshta.includes(pair) || this.db.matrices.bhakoot_logic.ashubha_neshta.includes(reversePair)) {
            return { pts: 0, bonus: 0, status: "Neshta" };
        }
        if (this.db.matrices.bhakoot_logic.shubha_bonus.includes(pair) || this.db.matrices.bhakoot_logic.shubha_bonus.includes(reversePair)) {
            return { pts: 0, bonus: 3, status: "Shubha" };
        }
        if ([0, 6, 2, 10, 3, 9].includes(diff)) return { pts: 7, bonus: 0, status: "Good" };
        return { pts: 0, bonus: 0, status: "Neutral" };
    }

    match(vadhuName, varaName) {
        const v = this.getDetails(vadhuName);
        const b = this.getDetails(varaName);
        if (!v || !b) return { error: "नावावरून नक्षत्र सापडले नाही. कृपया पूर्ण नाव किंवा पहिले अक्षर तपासा." };

        if (v.nakName === b.nakName && v.charan !== b.charan) return { finalScore: 36, remarks: ["नियम ५: एक नक्षत्र भिन्न चरण - ३६ गुण."], scoreDetails: {} };

        const m = this.db.matrices;
        const varna = m.varna[v.varna][b.varna];
        const vashya = m.vashya[v.vashya][b.vashya];
        const tara = this.calculateTara(v.nakID, b.nakID);
        const yoni = m.yoni.values[m.yoni.order.indexOf(v.yoni)][m.yoni.order.indexOf(b.yoni)];
        const maitri = m.graha_maitri.points[m.graha_maitri.lords[v.rashi]][m.graha_maitri.lords[b.rashi]];
        const gana = m.gana.matrix[m.gana.order.indexOf(v.gana)][m.gana.order.indexOf(b.gana)];
        const bRes = this.calculateBhakoot(v.rashi, b.rashi);
        const nadi = (v.nadi === b.nadi) ? 0 : 8;

        const pureTotal = varna + vashya + tara + yoni + maitri + gana + bRes.pts + nadi;
        const finalScore = pureTotal + bRes.bonus;

        let remarks = [];
        if (v.gana === "राक्षस" && b.gana === "मनुष्य" && finalScore >= 18) remarks.push("नियम ४: गण सवलत - विवाह कल्याणप्रद.");
        if (bRes.status === "Neshta") remarks.push("इशारा: नेष्ट भकूट संबंध!");

        return { finalScore, remarks, scoreDetails: { varna, vashya, tara, yoni, maitri, gana, bhakoot: bRes.pts + bRes.bonus, nadi } };
    }
}

// --- इंजिन सुरू करणे आणि डेटा लोड करणे ---
let engine;

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        engine = new KundaliGrandMaster(data);
        console.log("डेटा यशस्वीरित्या लोड झाला आहे.");
    })
    .catch(error => {
        console.error("डेटा लोड करताना चूक झाली:", error);
        alert("डेटा फाईल सापडली नाही!");
    });

document.getElementById('calculateBtn').addEventListener('click', () => {
    if (!engine) { alert("सिस्टिम लोड होत आहे, कृपया थोडा वेळ थांबा..."); return; }

    const bride = document.getElementById('brideName').value;
    const groom = document.getElementById('groomName').value;

    if (!bride || !groom) { alert("कृपया वधू आणि वराचे नाव टाका!"); return; }

    const res = engine.match(bride, groom);
    const resultArea = document.getElementById('resultArea');
    resultArea.classList.remove('hidden'); // CSS मध्ये .hidden असेल तर ते काढा

    if (res.error) {
        alert(res.error);
        return;
    }

    document.getElementById('finalScore').innerText = res.finalScore;
    
    // टेबल अपडेट करणे
    let tableHTML = "";
    const labels = {varna: "वर्ण", vashya: "वश्य", tara: "तारा", yoni: "योनी", maitri: "ग्रहमैत्री", gana: "गण", bhakoot: "भकूट", nadi: "नाडी"};
    
    for (let key in res.scoreDetails) {
        tableHTML += `<tr><td>${labels[key]}</td><td>${res.scoreDetails[key]}</td></tr>`;
    }
    document.getElementById('scoreTable').innerHTML = tableHTML;
    document.getElementById('remarks').innerHTML = res.remarks.map(r => `<p>• ${r}</p>`).join('');
    
    // रिझल्ट एरिया दिसावा म्हणून स्टाइल सेट करा
    resultArea.style.display = "block";
});
