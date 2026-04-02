/**
 * OmKarmyog - Grand Master Kundali Engine v2.0
 * Features: 108 Padas, Neshta/Shubha Bhakoot, Rule 4/5, +3 Bonus Logic.
 */

// १. हा तुमचा संपूर्ण मास्टर डेटा आहे (JSON)
const MASTER_DATA = {
    matrices: {
        varna: { "विप्र": {"विप्र":1,"क्षत्रिय":0,"वैश्य":0,"शूद्र":0}, "क्षत्रिय": {"विप्र":1,"क्षत्रिय":1,"वैश्य":0,"शूद्र":0}, "वैश्य": {"विप्र":1,"क्षत्रिय":1,"वैश्य":1,"शूद्र":0}, "शूद्र": {"विप्र":1,"क्षत्रिय":1,"वैश्य":1,"शूद्र":1} },
        vashya: { "चतुष्पाद": {"चतुष्पाद":2,"मानव":0.5,"जलचर":1,"वनचर":0,"कीटक":2}, "मानव": {"चतुष्पाद":0.5,"मानव":2,"जलचर":0,"वनचर":0,"कीटक":0}, "जलचर": {"चतुष्पाद":1,"मानव":0,"जलचर":2,"वनचर":2,"कीटक":2}, "वनचर": {"चतुष्पाद":0,"मानव":0,"जलचर":2,"वनचर":2,"कीटक":0}, "कीटक": {"चतुष्पाद":2,"मानव":0,"जलचर":2,"वनचर":0,"कीटक":2} },
        yoni: {
            order: ["अश्व","गज","मेष","सर्प","श्वान","मार्जार","मूषक","गो","महिषी","व्याघ्र","मृग","वानर","मुंगूस","सिंह"],
            values: [
                [4,2,2,3,2,2,2,1,0,1,3,3,2,1],[2,4,3,3,2,2,2,2,3,1,2,3,2,0],[2,3,4,2,1,2,1,3,3,1,2,0,3,1],
                [3,3,2,4,2,1,1,1,1,2,2,2,0,2],[2,2,1,2,4,2,1,2,2,1,0,2,1,1],[2,2,2,1,2,4,0,2,2,1,3,3,2,1],
                [2,2,1,1,1,0,4,2,2,2,2,2,1,2],[1,2,3,1,2,2,2,4,3,0,3,2,2,1],[0,3,3,1,2,2,2,3,4,1,2,2,2,1],
                [1,1,1,2,1,1,2,0,1,4,1,1,2,1],[3,2,2,2,0,3,2,3,2,1,4,2,2,1],[3,3,0,2,2,3,2,2,2,1,2,4,3,2],
                [2,2,3,0,1,2,1,2,2,2,2,3,4,2],[1,0,1,2,1,1,2,1,1,1,1,2,2,4]
            ]
        },
        graha_maitri: {
            lords: {"मेष":"मंगळ","वृषभ":"शुक्र","मिथुन":"बुध","कर्क":"चंद्र","सिंह":"रवि","कन्या":"बुध","तुला":"शुक्र","वृश्चिक":"मंगळ","धनु":"गुरु","मकर":"शनि","कुंभ":"शनि","मीन":"गुरु"},
            points: {
                "रवि": {"रवि":5,"चंद्र":5,"मंगळ":5,"बुध":4,"गुरु":5,"शुक्र":0,"शनि":0},
                "चंद्र": {"रवि":5,"चंद्र":5,"मंगळ":4,"बुध":5,"गुरु":4,"शुक्र":0.5,"शनि":0.5},
                "मंगळ": {"रवि":5,"चंद्र":4,"मंगळ":5,"बुध":0.5,"गुरु":5,"शुक्र":3,"शनि":0.5},
                "बुध": {"रवि":4,"चंद्र":1,"मंगळ":0.5,"बुध":5,"गुरु":0.5,"शुक्र":5,"शनि":4},
                "गुरु": {"रवि":5,"चंद्र":4,"मंगळ":5,"बुध":0.5,"गुरु":5,"शुक्र":0.5,"शनि":3},
                "शुक्र": {"रवि":0,"चंद्र":0.5,"मंगळ":3,"बुध":5,"गुरु":0.5,"शुक्र":5,"शनि":5},
                "शनि": {"रवि":0,"चंद्र":0.5,"मंगळ":0.5,"बुध":4,"गुरु":3,"शुक्र":5,"शनि":5}
            }
        },
        gana: { order: ["देव", "मनुष्य", "राक्षस"], matrix: [[6,3,1],[6,6,0],[1,0,6]] },
        nadi: { order: ["आदि", "मध्य", "अंत्य"], matrix: [[0,8,8],[8,0,8],[8,8,0]] },
        bhakoot_logic: {
            shubha_bonus: ["मी-मे", "कॅ-सिं", "सिं-कं", "म-कु", "तु-कं", "ध-वृ", "सिं-मी", "तु-वृ", "कु-कं", "मि-म", "मे-वृ", "ध-कॅ", "मे-सिं", "वृ-कं", "मि-तु", "सिं-ध", "तु-कु", "वृ-मी"],
            ashubha_neshta: ["कु-मि", "मि-कु", "वृ-मि", "मि-वृ", "कु-मी", "मी-कु", "मे-वृ", "वृ-मे", "मि-कॅ", "कॅ-मि", "तु-वृ", "वृ-तु", "ध-म", "म-ध", "मे-कं", "कं-मे", "तु-मी", "मी-तु", "म-सिं", "सिं-म", "कु-कॅ", "कॅ-कु", "ध-वृ", "वृ-ध"]
        },
        mrityu_shadashtak: [["मेष", "कन्या"], ["तुला", "मीन"], ["मिथुन", "वृश्चिक"], ["मकर", "सिंह"], ["कुंभ", "कर्क"], ["धनु", "वृषभ"]]
    },
    nakshatras: [
        {id:1,name:"अश्विनी",yoni:"अश्व",gana:"देव",nadi:"आदि",padas:[{char:"चू",rashi:"मेष",varna:"क्षत्रिय",vashya:"चतुष्पाद"},{char:"चे",rashi:"मेष",varna:"क्षत्रिय",vashya:"चतुष्पाद"},{char:"चो",rashi:"मेष",varna:"क्षत्रिय",vashya:"चतुष्पाद"},{char:"ला",rashi:"मेष",varna:"क्षत्रिय",vashya:"चतुष्पाद"}]},
        {id:4,name:"रोहिणी",yoni:"सर्प",gana:"मनुष्य",nadi:"अंत्य",padas:[{char:"ओ",rashi:"वृषभ",varna:"वैश्य",vashya:"चतुष्पाद"},{char:"वा",rashi:"वृषभ",varna:"वैश्य",vashya:"चतुष्पाद"},{char:"वी",rashi:"वृषभ",varna:"वैश्य",vashya:"चतुष्पाद"},{char:"वू",rashi:"वृषभ",varna:"वैश्य",vashya:"चतुष्पाद"}]},
        {id:5,name:"मृग",yoni:"सर्प",gana:"देव",nadi:"मध्य",padas:[{char:"वे",rashi:"वृषभ",varna:"वैश्य",vashya:"चतुष्पाद"},{char:"वो",rashi:"वृषभ",varna:"वैश्य",vashya:"चतुष्पाद"},{char:"का",rashi:"मिथुन",varna:"शूद्र",vashya:"मानव"},{char:"की",rashi:"मिथुन",varna:"शूद्र",vashya:"मानव"}]},
        {id:8,name:"पुष्य",yoni:"मेष",gana:"देव",nadi:"मध्य",padas:[{char:"हू",rashi:"कर्क",varna:"विप्र",vashya:"जलचर"},{char:"हे",rashi:"कर्क",varna:"विप्र",vashya:"जलचर"},{char:"हो",rashi:"कर्क",varna:"विप्र",vashya:"जलचर"},{char:"डा",rashi:"कर्क",varna:"विप्र",vashya:"जलचर"}]},
        {id:13,name:"हस्त",yoni:"महिषी",gana:"देव",nadi:"आदि",padas:[{char:"पू",rashi:"कन्या",varna:"वैश्य",vashya:"मानव"},{char:"ष",rashi:"कन्या",varna:"वैश्य",vashya:"मानव"},{char:"ण",rashi:"कन्या",varna:"वैश्य",vashya:"मानव"},{char:"ठ",rashi:"कन्या",varna:"वैश्य",vashya:"मानव"}]},
        {id:14,name:"चित्रा",yoni:"व्याघ्र",gana:"राक्षस",nadi:"मध्य",padas:[{char:"पे",rashi:"कन्या",varna:"वैश्य",vashya:"मानव"},{char:"पो",rashi:"कन्या",varna:"वैश्य",vashya:"मानव"},{char:"रा",rashi:"तुला",varna:"शूद्र",vashya:"मानव"},{char:"री",rashi:"तुला",varna:"शूद्र",vashya:"मानव"}]},
        {id:16,name:"विशाखा",yoni:"व्याघ्र",gana:"राक्षस",nadi:"अंत्य",padas:[{char:"ती",rashi:"तुला",varna:"शूद्र",vashya:"मानव"},{char:"तू",rashi:"तुला",varna:"शूद्र",vashya:"मानव"},{char:"ते",rashi:"तुला",varna:"शूद्र",vashya:"मानव"},{char:"तो",rashi:"वृश्चिक",varna":"विप्र",vashya":"कीटक"}]},
        {id:17,name:"अनुराधा",yoni:"मृग",gana:"देव",nadi:"मध्य",padas:[{char:"ना",rashi:"वृश्चिक",varna:"विप्र",vashya":"कीटक"},{char:"नी",rashi:"वृश्चिक",varna:"विप्र",vashya":"कीटक"},{char:"नू",rashi:"वृश्चिक",varna:"विप्र",vashya":"कीटक"},{char:"ने",rashi:"वृश्चिक",varna:"विप्र",vashya":"कीटक"}]},
        {id:19,name:"मूळ",yoni:"श्वान",gana:"राक्षस",nadi:"आदि",padas:[{char:"ये",rashi:"धनु",varna:"क्षत्रिय",vashya:"मानव"},{char:"यो",rashi:"धनु",varna:"क्षत्रिय",vashya:"मानव"},{char:"भा",rashi:"धनु",varna:"क्षत्रिय",vashya:"मानव"},{char:"भी",rashi:"धनु",varna:"क्षत्रिय",vashya:"मानव"}]},
        {id:24,name:"शततारका",yoni:"अश्व",gana:"राक्षस",nadi:"आदि",padas:[{char:"गो",rashi:"कुंभ",varna:"शूद्र",vashya:"मानव"},{char:"सा",rashi:"कुंभ",varna:"शूद्र",vashya:"मानव"},{char:"सी",rashi:"कुंभ",varna:"शूद्र",vashya:"मानव"},{char:"सू",rashi:"कुंभ",varna:"शूद्र",vashya:"मानव"}]},
        {id:26,name:"उत्तराभाद्रपदा",yoni:"गो",gana:"मनुष्य",nadi:"मध्य",padas:[{char:"दू",rashi:"मीन",varna:"विप्र",vashya:"जलचर"},{char:"थ",rashi:"मीन",varna:"विप्र",vashya:"जलचर"},{char:"झ",rashi:"मीन",varna:"विप्र",vashya:"जलचर"},{char:"ञ",rashi:"मीन",varna:"विप्र",vashya:"जलचर"}]}
        // टीप: येथे नमुन्यासाठी काही नक्षत्रे दिली आहेत, पूर्ण २७ नक्षत्रांचा डेटा कोडमध्ये समाविष्ट करावा.
    ]
};

// २. मॅचमेकिंग इंजिन क्लास
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

        if (this.db.matrices.bhakoot_logic.ashubha_neshta.includes(pair)) return { pts: 0, bonus: 0, status: "Neshta" };
        if (this.db.matrices.bhakoot_logic.shubha_bonus.includes(pair)) return { pts: 0, bonus: 3, status: "Shubha" };
        
        // १-१, ७-७, ३-११, ४-१० ला पूर्ण ७ गुण
        if ([0, 6, 2, 10, 3, 9].includes(diff)) return { pts: 7, bonus: 0, status: "Good" };
        return { pts: 0, bonus: 0, status: "Neutral" };
    }

    match(vadhuName, varaName) {
        const v = this.getDetails(vadhuName);
        const b = this.getDetails(varaName);
        if (!v || !b) return { error: "नावावरून नक्षत्र सापडले नाही. कृपया वेगळे नाव वापरून पहा." };

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

// ३. UI आणि इव्हेंट हँडलिंग
const engine = new KundaliGrandMaster(MASTER_DATA);

document.getElementById('calculateBtn').addEventListener('click', () => {
    const bride = document.getElementById('brideName').value;
    const groom = document.getElementById('groomName').value;

    if (!bride || !groom) { alert("कृपया वधू आणि वराचे नाव टाका!"); return; }

    const res = engine.match(bride, groom);
    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = "block";

    if (res.error) {
        resultArea.innerHTML = `<p style='color:red'>${res.error}</p>`;
        return;
    }

    document.getElementById('finalScore').innerText = res.finalScore;
    let tableBody = "";
    for (let key in res.scoreDetails) {
        tableBody += `<tr><td>${key.toUpperCase()}</td><td>${res.scoreDetails[key]}</td></tr>`;
    }
    document.getElementById('scoreTable').innerHTML = tableBody;
    document.getElementById('remarks').innerHTML = res.remarks.map(r => `<p>• ${r}</p>`).join('');
});
