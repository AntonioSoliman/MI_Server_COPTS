// src/components/PrintWizard.jsx
import { useState, useEffect } from 'react';
import { getOccasioni, getPreghiere, getCanti, getStrofe } from '../services/api';
import { reshape } from 'arabic-persian-reshaper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PrintWizard({ onClose }) {
  const [step, setStep] = useState(0);
  const [layout, setLayout] = useState('vertical');
  const [occasioni, setOccasioni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ occasione: null, preghiere: [] });

  const CROSS_IMAGE_URL = "https://www.vhv.rs/dpng/d/535-5358301_red-coptic-cross-hd-png-download.png";
  const LOGO_DIOCESI_URL = "https://www.diocesicoptamilano.com/uploads/1/3/8/2/13826853/6182570_orig.png";

  const roleMap = {
    "Prete": { it: "Il Prete", cptIt: "Pioúib", cpt: "Ⲡⲓⲟⲩⲏⲃ", cptAra: "بي أوويب", ara: "الكاهن" },
    "Diacono": { it: "Il Diacono", cptIt: "Piziakón", cpt: "Ⲡⲓⲇⲓⲁⲕⲱⲛ", cptAra: "بي ذياكون", ara: "الشماس" },
    "Popolo": { it: "Il Popolo", cptIt: "Pilaos", cpt: "Ⲡⲓⲗⲁⲟⲥ", cptAra: "بي laos", ara: "الشعب" }
  };

  useEffect(() => { if (step === 1) loadOccasioni(); }, [step]);

  const loadOccasioni = async () => {
    try {
      const list = await getOccasioni();
      setOccasioni(list);
    } catch (err) { console.error(err); }
  };

  const fetchFontBase64 = async (fileName) => {
    try {
      const response = await fetch(`/fonts/${fileName}`);
      if (!response.ok) throw new Error(`Font ${fileName} non trovato`);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const selezionaOccasione = async (occ) => {
    setLoading(true);
    try {
      const preghiereList = await getPreghiere(occ._id);
      const preghiereComplete = await Promise.all(preghiereList.map(async (p) => {
        const cantiList = await getCanti(p._id);
        const cantiConStrofe = await Promise.all(cantiList.map(async (c) => {
          const strofeList = await getStrofe(c._id);
          return { ...c, selected: true, strofe: (strofeList || []).map(s => ({ ...s, selected: true })) };
        }));
        return { ...p, selected: true, canti: cantiConStrofe };
      }));
      setData({ occasione: occ, preghiere: preghiereComplete });
      setStep(2);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const toRoman = (num) => {
    const map = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let result = '';
    for (let key in map) { while (num >= map[key]) { result += key; num -= map[key]; } }
    return result;
  };

  const ensureImageData = async (url, removeBg = false) => {
    if (!url) return null;
    const finalUrl = url.startsWith('data:image') ? url : "https://corsproxy.io/?" + encodeURIComponent(url);
    return new Promise((resolve) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        if (removeBg) {
          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let d = imageData.data;
          for (let i = 0; i < d.length; i += 4) { if (d[i] > 230 && d[i+1] > 230 && d[i+2] > 230) d[i+3] = 0; }
          ctx.putImageData(imageData, 0, 0);
        }
        resolve({ data: canvas.toDataURL("image/png"), w: img.width, h: img.height });
      };
      img.onerror = () => resolve(null);
      img.src = finalUrl;
    });
  };

  /**
   * FUNZIONE DI FORMATTAZIONE ARABA DEFINITIVA
   * 1. Applica il reshape (unione glifi)
   * 2. Inverte i caratteri (necessario per jsPDF LTR)
   * 3. Mantiene la coerenza della punteggiatura
   */
  const formatAr = (t) => {
    if (!t) return "";
    try {
      const reshaped = reshape(t);
      return reshaped.split('').reverse().join('');
    } catch (e) { return t; }
  };

  const generaPDF = async () => {
    setLoading(true);
    try {
      const isVert = layout === 'vertical';
      const CONFIG = {
        orientation: isVert ? 'p' : 'l',
        format: isVert ? 'a4' : [297, 167],
        bgColor: isVert ? '#ffffff' : '#000000',
        textColor: isVert ? '#000000' : '#ffffff',
        secColor: isVert ? '#555555' : '#f1c40f',
        margin: 15,
      };

      const doc = new jsPDF(CONFIG.orientation, 'mm', CONFIG.format);
      
      const fonts = {
        'Noto-Reg': 'NotoSans-Regular.ttf',
        'Noto-Bold': 'NotoSans-Bold.ttf',
        'Ara-Reg': 'NotoSansArabic-Regular.ttf',
        'Ara-Bold': 'NotoSansArabic-Bold.ttf',
        'Coptic': 'NotoSansCoptic-Regular.ttf'
      };

      for (const [key, file] of Object.entries(fonts)) {
        const dataStr = await fetchFontBase64(file);
        if (dataStr) {
          doc.addFileToVFS(file, dataStr);
          if (key.includes('Noto')) doc.addFont(file, "Noto", key.includes('Bold') ? "bold" : "normal");
          if (key.includes('Ara')) doc.addFont(file, "NotoAra", key.includes('Bold') ? "bold" : "normal");
          if (key.includes('Coptic')) doc.addFont(file, "Coptic", "normal");
        }
      }

      doc.setFont("Noto", "normal");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const crossImg = await ensureImageData(CROSS_IMAGE_URL, true);
      const logoDiocesiImg = await ensureImageData(LOGO_DIOCESI_URL, true);

      const setPageBackground = () => { if (!isVert) { doc.setFillColor(0, 0, 0); doc.rect(0, 0, pageWidth, pageHeight, 'F'); } };

      const drawWatermark = () => {
        if (crossImg) {
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: isVert ? 0.25 : 0.15 })); 
          const size = Math.min(pageWidth, pageHeight) * 0.6;
          doc.addImage(crossImg.data, 'PNG', (pageWidth - size) / 2, (pageHeight - size) / 2, size, size);
          doc.restoreGraphicsState();
        }
      };

      // 1. COPERTINA
      setPageBackground();
      if (data.occasione?.imageUrl) {
        const imgObj = await ensureImageData(data.occasione.imageUrl);
        if (imgObj) {
          const imgRatio = imgObj.w / imgObj.h;
          let drawW, drawH;
          if (pageWidth / pageHeight > imgRatio) { drawH = pageHeight; drawW = pageHeight * imgRatio; }
          else { drawW = pageWidth; drawH = pageWidth / imgRatio; }
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: 0.7 })); 
          doc.addImage(imgObj.data, 'PNG', (pageWidth - drawW) / 2, (pageHeight - drawH) / 2, drawW, drawH);
          doc.restoreGraphicsState();
        }
      }

      doc.setTextColor(CONFIG.textColor);
      doc.setFont("Noto", "bold");
      const headerText = "Diocesi della Chiesa Copta Ortodossa di Milano";
      doc.setFontSize(12);
      
      if (logoDiocesiImg) {
          const logoH = 24; 
          const logoW = (logoDiocesiImg.w / logoDiocesiImg.h) * logoH;
          const totalHeaderWidth = logoW + 5 + doc.getTextWidth(headerText);
          const startX = (pageWidth - totalHeaderWidth) / 2;
          doc.addImage(logoDiocesiImg.data, 'PNG', startX, 10, logoW, logoH);
          doc.text(headerText, startX + logoW + 5, 10 + (logoH / 2), { baseline: 'middle' });
      }

      doc.setFontSize(28);
      doc.text(data.occasione?.titolo || "Libretto Liturgico", pageWidth / 2, pageHeight / 2, { align: 'center' });
      doc.setFontSize(12); doc.setFont("Noto", "normal");
      doc.text("MI_Server_COPTS", pageWidth / 2, pageHeight - 10, { align: 'center' });

      // 2. PAGINE PRELIMINARI
      doc.addPage(); setPageBackground(); drawWatermark(); 
      doc.addPage(); setPageBackground(); drawWatermark(); 
      const indexPageIndex = doc.internal.getNumberOfPages();
      doc.addPage(); setPageBackground(); drawWatermark(); 

      // 3. CONTENUTI
      const tocStructure = [];
      const mappingPagine = {}; 
      const preghiereScelte = data.preghiere.filter(p => p.selected);

      for (let p of preghiereScelte) {
        const cantiFiltrati = p.canti.filter(c => c.selected);
        let haStrofe = false;
        for (let c of cantiFiltrati) { if(c.strofe.filter(s => s.selected).length > 0) { haStrofe = true; break; } }
        if(!haStrofe) continue;

        doc.addPage(); setPageBackground(); drawWatermark();
        const prayerStartPage = doc.internal.getNumberOfPages(); 
        doc.setFontSize(24); doc.setFont("Noto", "bold"); doc.setTextColor(CONFIG.secColor);
        doc.text(p.titolo, pageWidth / 2, pageHeight / 2, { align: 'center' });

        let pGroup = { title: p.titolo, startPage: prayerStartPage, canti: [] };

        for (let c of cantiFiltrati) {
          const strofeScelte = c.strofe.filter(s => s.selected);
          if (strofeScelte.length === 0) continue;

          if (isVert) {
            doc.addPage(); setPageBackground(); drawWatermark();
          }
          const firstPageOfCanto = doc.internal.getNumberOfPages();
          pGroup.canti.push({ title: c.titoloIt, page: firstPageOfCanto, realPage: firstPageOfCanto - 4 });

          // TITOLO CANTO BILINGUE
          if (isVert) {
            doc.setFontSize(18); doc.setTextColor(CONFIG.secColor); doc.setFont("Noto", "bold");
            doc.text(c.titoloIt, CONFIG.margin, 30);
            doc.setFont("NotoAra", "bold");
            doc.text(formatAr(c.titoloAra || ""), pageWidth - CONFIG.margin, 30, { align: 'right' });
          }
          
          strofeScelte.forEach((s, idx) => {
            if (!s.testo?.it && !s.testo?.ara && !s.testo?.cpt) return;

            if (!isVert) {
              doc.addPage(); setPageBackground(); drawWatermark();
              doc.setFontSize(22); doc.setTextColor(CONFIG.secColor); doc.setFont("Noto", "bold");
              doc.text(c.titoloIt, CONFIG.margin, 20);
              doc.setFont("NotoAra", "bold");
              doc.text(formatAr(c.titoloAra || ""), pageWidth - CONFIG.margin, 20, { align: 'right' });
            }

            const r = roleMap[s.ruolo] || { it: s.ruolo, cptIt: "", cpt: "", cptAra: "", ara: "" };
            const roleFontSize = isVert ? 8 : 13;
            const textFontSize = isVert ? 10 : 19;
            const currentY = isVert ? (idx === 0 ? 40 : doc.lastAutoTable.finalY + 10) : 32;

            // TABELLA 1: ITALIANO / COPTO FR / COPTO (Logica 34-33-33 originale)
            autoTable(doc, {
              startY: currentY,
              body: [
                [
                  { content: r.it || "", styles: { font: "Noto", fontStyle: 'bold', textColor: CONFIG.secColor, fontSize: roleFontSize } },
                  { content: r.cptIt || "", styles: { font: "Noto", fontStyle: 'bold', textColor: CONFIG.secColor, fontSize: roleFontSize } },
                  { content: r.cpt || "", styles: { font: "Coptic", textColor: CONFIG.secColor, fontSize: roleFontSize } }
                ],
                [
                  { content: s.testo?.it || "", styles: { halign: 'justify', fontSize: textFontSize } },
                  { content: s.testo?.cptIt || "", styles: { halign: 'justify', fontSize: textFontSize } },
                  { content: s.testo?.cpt || "", styles: { font: "Coptic", halign: 'justify', fontSize: textFontSize } }
                ]
              ],
              theme: 'plain',
              styles: { font: "Noto", textColor: isVert ? 0 : 255, cellPadding: isVert ? 2 : 4, overflow: 'linebreak' },
              columnStyles: { 0: { cellWidth: '34%' }, 1: { cellWidth: '33%' }, 2: { cellWidth: '33%' } },
              margin: { left: CONFIG.margin, right: CONFIG.margin },
            });

            // TABELLA 2: FRANCO ARABO / ARABO (Logica 50-50 originale)
            autoTable(doc, {
              startY: doc.lastAutoTable.finalY,
              body: [
                [
                  { content: formatAr(r.cptAra) || "", styles: { font: "NotoAra", fontStyle: 'bold', halign: 'right', textColor: CONFIG.secColor, fontSize: roleFontSize } },
                  { content: formatAr(r.ara) || "", styles: { font: "NotoAra", fontStyle: 'bold', halign: 'right', textColor: CONFIG.secColor, fontSize: roleFontSize } }
                ],
                [
                  { content: formatAr(s.testo?.cptAra) || "", styles: { font: "NotoAra", halign: 'right', fontSize: textFontSize } },
                  { content: formatAr(s.testo?.ara) || "", styles: { font: "NotoAra", halign: 'right', fontSize: textFontSize } }
                ]
              ],
              theme: 'plain',
              styles: { font: "NotoAra", textColor: isVert ? 0 : 255, cellPadding: isVert ? 2 : 4, overflow: 'linebreak' },
              columnStyles: { 0: { cellWidth: '50%' }, 1: { cellWidth: '50%' } },
              margin: { left: CONFIG.margin, right: CONFIG.margin },
              pageBreak: isVert ? 'auto' : 'avoid',
              didDrawPage: () => { mappingPagine[doc.internal.getNumberOfPages()] = { p: p.titolo, c: c.titoloIt }; }
            });
          });
        }
        if (pGroup.canti.length > 0) tocStructure.push(pGroup);
      }

      // 4. INDICE
      doc.setPage(indexPageIndex);
      doc.setFontSize(22); doc.setFont("Noto", "bold"); doc.setTextColor(CONFIG.secColor);
      doc.text("INDICE", pageWidth / 2, 25, { align: 'center' });
      let iy = 40;
      tocStructure.forEach(group => {
        doc.setFontSize(12); doc.setFont("Noto", "bold"); doc.setTextColor(CONFIG.textColor);
        doc.text(group.title.toUpperCase(), CONFIG.margin, iy);
        doc.link(CONFIG.margin, iy - 5, pageWidth - 30, 8, { pageNumber: group.startPage });
        iy += 8;
        group.canti.forEach(canto => {
          doc.setFontSize(10); doc.setFont("Noto", "normal");
          doc.text("   " + canto.title, CONFIG.margin, iy);
          doc.text(canto.realPage.toString(), pageWidth - CONFIG.margin, iy, { align: 'right' });
          doc.link(CONFIG.margin, iy - 4, pageWidth - 30, 6, { pageNumber: canto.page });
          iy += 6;
        });
        iy += 4;
      });

      // 5. FOOTER
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setFont("Noto", "normal"); doc.setTextColor(150);
        if (i > 4) {
          const info = mappingPagine[i] || { p: "", c: "" };
          if(info.p) { doc.text(`${info.p.toUpperCase()} - ${info.c.toUpperCase()}`, CONFIG.margin, 10); }
          const homeLabel = "🏠 INDICE";
          const homeWidth = doc.getTextWidth(homeLabel);
          doc.text(homeLabel, pageWidth - CONFIG.margin, 10, { align: 'right' }); 
          doc.link(pageWidth - CONFIG.margin - homeWidth, 5, homeWidth + 2, 8, { pageNumber: indexPageIndex });
          doc.setDrawColor(220); doc.line(CONFIG.margin, 12, pageWidth - CONFIG.margin, 12);
          doc.text((data.occasione?.titolo || "LIBRETTO").toUpperCase(), CONFIG.margin, pageHeight - 10);
          doc.text((i - 4).toString(), pageWidth - CONFIG.margin, pageHeight - 10, { align: 'right' });
          doc.link(pageWidth - CONFIG.margin - 10, pageHeight - 15, 15, 10, { pageNumber: indexPageIndex });
        } else if (i > 1) {
          doc.text(toRoman(i - 1), pageWidth - CONFIG.margin, pageHeight - 10, { align: 'right' });
        }
      }

      doc.save(`${data.occasione?.titolo || "Libretto"}_2026.pdf`);
      onClose();
    } catch (err) { console.error(err); alert("Errore generazione PDF"); }
    setLoading(false);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        {loading && <div style={loaderStyle}>⏳ Caricamento Font e Generazione...</div>}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2>🖨️ Stampa Libretto</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>
        <hr />
        {step === 0 && (
          <div style={{textAlign:'center', padding:'30px'}}>
            <h3>Scegli il formato:</h3>
            <div style={{display:'flex', gap:'20px', justifyContent:'center', margin:'30px 0'}}>
              <div onClick={() => setLayout('vertical')} style={{...layoutCardStyle, flex: 1, border: layout === 'vertical' ? '3px solid #007bff' : '1px solid #ccc'}}>
                <div style={{width:'30px', height:'45px', border:'1px solid #000', margin:'0 auto 10px', background:'#fff'}}></div>
                <h4>Verticale</h4>
                <small>Smartphone / A4</small>
              </div>
              <div onClick={() => setLayout('horizontal')} style={{...layoutCardStyle, flex: 1, border: layout === 'horizontal' ? '3px solid #007bff' : '1px solid #ccc', background:'#333', color:'#fff'}}>
                <div style={{width:'45px', height:'30px', border:'1px solid #fff', margin:'0 auto 10px', background:'#000'}}></div>
                <h4>Orizzontale</h4>
                <small>Proiezione / Schermo</small>
              </div>
            </div>
            <button onClick={() => setStep(1)} style={nextButtonStyle}>Inizia</button>
          </div>
        )}
        {step >= 1 && step <= 4 && (
          <div style={listContainerStyle}>
            {step === 1 && occasioni.map(o => <button key={o._id} onClick={() => selezionaOccasione(o)} style={itemButtonStyle}>{o.titolo}</button>)}
            {step === 2 && data.preghiere.map((p, i) => (
              <div key={p._id} style={checkRowStyle}>
                <input type="checkbox" checked={p.selected} onChange={() => {
                  const next = [...data.preghiere]; next[i].selected = !next[i].selected; setData({ ...data, preghiere: next });
                }} /> <span>{p.titolo}</span>
              </div>
            ))}
            {step === 3 && data.preghiere.filter(p => p.selected).map(p => (
              <div key={p._id} style={{marginBottom:'10px'}}>
                <div style={{background:'#f0f0f0', padding:'5px', fontWeight:'bold'}}>{p.titolo}</div>
                {p.canti.map((c, ci) => (
                  <div key={c._id} style={checkRowStyle}>
                    <input type="checkbox" checked={c.selected} onChange={() => {
                      const next = [...data.preghiere]; const pi = next.findIndex(x => x._id === p._id);
                      next[pi].canti[ci].selected = !next[pi].canti[ci].selected; setData({ ...data, preghiere: next });
                    }} /> <span>{c.titoloIt}</span>
                  </div>
                ))}
              </div>
            ))}
            {step === 4 && data.preghiere.filter(p => p.selected).map(p => p.canti.filter(c => c.selected).map(c => (
              <div key={c._id} style={{marginBottom:'10px'}}>
                <div style={{borderBottom:'1px solid #ccc', fontWeight:'bold'}}>{c.titoloIt}</div>
                {c.strofe.map((s, si) => (
                  <div key={s._id} style={checkRowStyle}>
                    <input type="checkbox" checked={s.selected} onChange={() => {
                      const next = [...data.preghiere]; const pi = next.findIndex(x => x._id === p._id);
                      const ci = next[pi].canti.findIndex(y => y._id === c._id);
                      next[pi].canti[ci].strofe[si].selected = !next[pi].canti[ci].strofe[si].selected;
                      setData({ ...data, preghiere: next });
                    }} /> <span style={{fontSize:'10px'}}>{s.testo?.it?.substring(0,50)}...</span>
                  </div>
                ))}
              </div>
            )))}
          </div>
        )}
        {step > 0 && step < 4 && step !== 1 && <button onClick={() => setStep(step + 1)} style={nextButtonStyle}>Avanti</button>}
        {step === 4 && <button onClick={generaPDF} style={confirmButtonStyle}>GENERA PDF</button>}
        {step > 0 && <button onClick={() => setStep(step - 1)} style={backButtonStyle}>Indietro</button>}
      </div>
    </div>
  );
}

const modalOverlayStyle = { position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.85)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 };
const modalContentStyle = { backgroundColor:'#fff', padding:'25px', borderRadius:'15px', width:'95%', maxWidth:'650px', maxHeight:'90vh', overflowY:'auto', position:'relative' };
const loaderStyle = { position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(255,255,255,0.95)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:10, fontSize:'18px', fontWeight:'bold', flexDirection:'column' };
const listContainerStyle = { maxHeight:'350px', overflowY:'auto', border:'1px solid #eee', padding:'10px', borderRadius:'8px', marginTop:'10px' };
const checkRowStyle = { display:'flex', alignItems:'center', gap:'10px', padding:'6px 0', borderBottom:'1px solid #f9f9f9' };
const itemButtonStyle = { display:'block', width:'100%', padding:'12px', marginBottom:'8px', textAlign:'left', border:'1px solid #ddd', background:'#f8f9fa', borderRadius:'8px', cursor:'pointer', fontWeight:'500' };
const nextButtonStyle = { marginTop:'20px', padding:'12px', width:'100%', backgroundColor:'#000', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', fontSize:'15px' };
const confirmButtonStyle = { ...nextButtonStyle, backgroundColor:'#27ae60' };
const backButtonStyle = { marginTop:'15px', width:'100%', background:'none', border:'none', color:'#666', textDecoration:'underline', cursor:'pointer' };
const closeBtn = { background:'none', border:'none', fontSize:'24px', cursor:'pointer' };
const layoutCardStyle = { width:'140px', padding:'20px', borderRadius:'10px', cursor:'pointer', textAlign:'center', transition:'0.2s', display:'flex', flexDirection:'column', justifyContent:'center' };
