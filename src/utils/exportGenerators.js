/**
 * Export Generators: PowerPoint (.pptx) and Word (.docx) client-side generation
 * Builds standard OpenXML packages using JSZip without external heavy binaries.
 */
import JSZip from 'jszip';

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseMarkdownToSlides(text = '') {
  const lines = text.split('\n');
  const slides = [];
  let currentSlide = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
      if (currentSlide && (currentSlide.title || currentSlide.bullets.length > 0)) {
        slides.push(currentSlide);
      }
      const title = line.replace(/^#+\s*/, '').replace(/\*+/g, '');
      currentSlide = { title, bullets: [] };
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ') || /^\d+\.\s/.test(line)) {
      const bullet = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').replace(/\*+/g, '');
      if (!currentSlide) {
        currentSlide = { title: 'Key Takeaways', bullets: [] };
      }
      currentSlide.bullets.push(bullet);
    } else if (currentSlide) {
      if (currentSlide.bullets.length < 6 && line.length > 3) {
        currentSlide.bullets.push(line.replace(/\*+/g, ''));
      }
    } else {
      currentSlide = { title: line.slice(0, 60), bullets: [] };
    }
  }

  if (currentSlide && (currentSlide.title || currentSlide.bullets.length > 0)) {
    slides.push(currentSlide);
  }

  if (slides.length === 0) {
    slides.push({
      title: "Bhavya's AI Assistant - Executive Summary",
      bullets: [text.slice(0, 300) || 'No content provided.']
    });
  }

  return slides;
}

export async function exportToPptx(markdownContent, topicTitle = 'AI Executive Presentation') {
  const slides = parseMarkdownToSlides(markdownContent);
  const zip = new JSZip();

  let contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
`;

  slides.forEach((_, index) => {
    contentTypes += `  <Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`;
  });
  contentTypes += `</Types>`;
  zip.file('[Content_Types].xml', contentTypes);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

  let presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
`;
  slides.forEach((_, idx) => {
    presRels += `  <Relationship Id="rId${idx + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>\n`;
  });
  presRels += `</Relationships>`;
  zip.file('ppt/_rels/presentation.xml.rels', presRels);

  let slideIdList = '';
  slides.forEach((_, idx) => {
    slideIdList += `    <p:sldId id="${256 + idx}" r:id="rId${idx + 2}"/>\n`;
  });

  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>\n${slideIdList}  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`);

  zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="CyberTheme">
  <a:themeElements>
    <a:clrScheme name="CyberPalette">
      <a:dk1><a:srgbClr val="0B0F19"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1E293B"/></a:dk2>
      <a:lt2><a:srgbClr val="E2E8F0"/></a:lt2>
      <a:accent1><a:srgbClr val="06B6D4"/></a:accent1>
      <a:accent2><a:srgbClr val="8B5CF6"/></a:accent2>
      <a:accent3><a:srgbClr val="10B981"/></a:accent3>
      <a:accent4><a:srgbClr val="F59E0B"/></a:accent4>
      <a:accent5><a:srgbClr val="EC4899"/></a:accent5>
      <a:accent6><a:srgbClr val="3B82F6"/></a:accent6>
      <a:hlink><a:srgbClr val="38BDF8"/></a:hlink>
      <a:folHlink><a:srgbClr val="A855F7"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Modern">
      <a:majorFont><a:latin typeface="Segoe UI Semibold"/></a:majorFont>
      <a:minorFont><a:latin typeface="Segoe UI"/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`);

  zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`);

  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`);

  zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" type="titleAndBody">
  <p:cSld name="Title and Content"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`);

  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`);

  slides.forEach((slide, idx) => {
    const isTitleSlide = idx === 0;
    const titleText = escapeXml(slide.title || topicTitle);

    let bulletsXml = '';
    slide.bullets.forEach(bullet => {
      const bText = escapeXml(bullet);
      bulletsXml += `
            <a:p>
              <a:pPr lvl="0"><a:buChar char="•"/></a:pPr>
              <a:r>
                <a:rPr lang="en-US" sz="2000">
                  <a:solidFill><a:srgbClr val="E2E8F0"/></a:solidFill>
                </a:rPr>
                <a:t>${bText}</a:t>
              </a:r>
            </a:p>`;
    });

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="SlideBg"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="${isTitleSlide ? '0F172A' : '090D16'}"/></a:solidFill>
        </p:spPr>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="838200" y="609600"/><a:ext cx="10515600" cy="1143000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="${isTitleSlide ? '3800' : '2800'}" b="1">
                <a:solidFill><a:srgbClr val="${isTitleSlide ? '38BDF8' : 'FFFFFF'}"/></a:solidFill>
              </a:rPr>
              <a:t>${titleText}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="838200" y="1981200"/><a:ext cx="10515600" cy="4267200"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"/>
${bulletsXml || `
            <a:p>
              <a:r>
                <a:rPr lang="en-US" sz="2000"><a:solidFill><a:srgbClr val="94A3B8"/></a:solidFill></a:rPr>
                <a:t>Generated by Bhavya's AI Assistant.</a:t>
              </a:r>
            </a:p>`}
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="5" name="Footer"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="838200" y="6400800"/><a:ext cx="10515600" cy="300000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="1100"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill></a:rPr>
              <a:t>Bhavya's AI Assistant • Slide ${idx + 1} of ${slides.length}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    zip.file(`ppt/slides/slide${idx + 1}.xml`, slideXml);
    zip.file(`ppt/slides/_rels/slide${idx + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`);
  });

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  const cleanTitle = (topicTitle || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  triggerDownload(blob, `${cleanTitle}_Deck_${Date.now()}.pptx`);
  return true;
}

export async function exportToDocx(markdownContent, docTitle = 'Research Document') {
  const zip = new JSZip();
  const cleanTitle = escapeXml(docTitle);
  const lines = markdownContent.split('\n');

  let bodyXml = `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="360" w:after="240"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="0EA5E9"/></w:rPr>
        <w:t>${cleanTitle}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="360"/></w:pPr>
      <w:r>
        <w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr>
        <w:t>Generated by Bhavya's AI Assistant on ${new Date().toLocaleDateString()}</w:t>
      </w:r>
    </w:p>
  `;

  lines.forEach(rawLine => {
    const line = rawLine.trim();
    if (!line) {
      bodyXml += `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`;
      return;
    }

    if (line.startsWith('# ')) {
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:before="280" w:after="140"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0284C7"/></w:rPr>
            <w:t>${escapeXml(line.replace(/^#\s*/, ''))}</w:t>
          </w:r>
        </w:p>`;
    } else if (line.startsWith('## ')) {
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="0369A1"/></w:rPr>
            <w:t>${escapeXml(line.replace(/^##\s*/, ''))}</w:t>
          </w:r>
        </w:p>`;
    } else if (line.startsWith('### ')) {
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr>
          <w:r>
            <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F172A"/></w:rPr>
            <w:t>${escapeXml(line.replace(/^###\s*/, ''))}</w:t>
          </w:r>
        </w:p>`;
    } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      const itemText = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
      bodyXml += `
        <w:p>
          <w:pPr><w:ind w:left="400"/><w:spacing w:after="80"/></w:pPr>
          <w:r>
            <w:rPr><w:sz w:val="22"/><w:color w:val="334155"/></w:rPr>
            <w:t>• ${escapeXml(itemText)}</w:t>
          </w:r>
        </w:p>`;
    } else {
      bodyXml += `
        <w:p>
          <w:pPr><w:spacing w:after="120"/></w:pPr>
          <w:r>
            <w:rPr><w:sz w:val="22"/><w:color w:val="1E293B"/></w:rPr>
            <w:t>${escapeXml(line)}</w:t>
          </w:r>
        </w:p>`;
    }
  });

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const safeFilename = (docTitle || 'Document').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  triggerDownload(blob, `${safeFilename}_${Date.now()}.docx`);
  return true;
}
