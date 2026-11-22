export interface ComplianceColumn {
	header: string;
	width: number;
	align?: "left" | "right";
}

export interface CsvExportOptions {
	filename: string;
	headers: string[];
	rows: (string | number)[][];
}

export interface PdfComplianceReportOptions {
	filename: string;
	title: string;
	subtitle?: string;
	metadata?: { label: string; value: string }[];
	columns: ComplianceColumn[];
	rows: (string | number)[][];
}

const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value: string | number): string {
	const raw = String(value ?? "");
	const safe = FORMULA_START.test(raw) ? `'${raw}` : raw;
	return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function downloadCsvReport({ filename, headers, rows }: CsvExportOptions) {
	const csv = [headers, ...rows]
		.map((cols) => cols.map(csvCell).join(","))
		.join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

function sanitizePdfText(value: string | number): string {
	return String(value ?? "")
		.replaceAll("\u2014", "--")
		.replaceAll("\u2013", "-")
		.replaceAll("\u00b7", "-")
		.replaceAll("\u2022", "*")
		.replaceAll("\u2026", "...")
		.replace(/[^\x20-\x7e]/g, "?");
}

function escapePdfLiteral(text: string): string {
	return text
		.replaceAll("\\", "\\\\")
		.replaceAll("(", "\\(")
		.replaceAll(")", "\\)");
}

function fitCellText(text: string | number, maxWidthPt: number, fontSize = 8): string {
	const clean = sanitizePdfText(text);
	const approxCharWidth = fontSize * 0.54;
	const maxChars = Math.max(3, Math.floor((maxWidthPt - 8) / approxCharWidth));
	if (clean.length <= maxChars) return clean;
	return `${clean.slice(0, Math.max(1, maxChars - 3))}...`;
}

export function downloadPdfComplianceReport({
	filename,
	title,
	subtitle,
	metadata = [],
	columns,
	rows,
}: PdfComplianceReportOptions) {
	const pageWidth = 792;
	const pageHeight = 612;
	const marginX = 36;
	const usableWidth = pageWidth - marginX * 2;
	const totalDefinedWidth = columns.reduce((sum, c) => sum + c.width, 0) || 1;
	const colWidths = columns.map((c) => (c.width / totalDefinedWidth) * usableWidth);

	const rowHeight = 20;
	const headerBarHeight = 22;
	const firstPageTop = pageHeight - 134;
	const nextPageTop = pageHeight - 76;
	const bottomMargin = 44;

	const firstPageRows = Math.max(
		1,
		Math.floor((firstPageTop - headerBarHeight - bottomMargin) / rowHeight)
	);
	const nextPageRows = Math.max(
		1,
		Math.floor((nextPageTop - headerBarHeight - bottomMargin) / rowHeight)
	);

	const pagesRows: (string | number)[][][] = [];
	if (rows.length === 0) {
		pagesRows.push([]);
	} else {
		let offset = 0;
		pagesRows.push(rows.slice(0, firstPageRows));
		offset += firstPageRows;
		while (offset < rows.length) {
			pagesRows.push(rows.slice(offset, offset + nextPageRows));
			offset += nextPageRows;
		}
	}

	const totalPages = pagesRows.length;
	const generatedStamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

	const contentStreams: string[] = pagesRows.map((pageRows, pageIndex) => {
		const cmds: string[] = [];
		const isFirst = pageIndex === 0;

		// Top brand accent line & header
		cmds.push("0.15 0.17 0.21 RG 1 w");
		cmds.push(`${marginX} ${pageHeight - 28} m ${pageWidth - marginX} ${pageHeight - 28} l S`);

		cmds.push("BT");
		cmds.push("/F2 9 Tf 0.42 0.45 0.50 rg");
		cmds.push(`1 0 0 1 ${marginX} ${pageHeight - 22} Tm`);
		cmds.push(`(${escapePdfLiteral("HAMZET WASEL DASHBOARD - COMPLIANCE REPORT")}) Tj`);
		cmds.push("ET");

		cmds.push("BT");
		cmds.push("/F1 8 Tf 0.45 0.48 0.53 rg");
		cmds.push(`1 0 0 1 ${pageWidth - marginX - 155} ${pageHeight - 22} Tm`);
		cmds.push(`(${escapePdfLiteral(`Generated: ${generatedStamp}`)}) Tj`);
		cmds.push("ET");

		if (isFirst) {
			cmds.push("BT");
			cmds.push("/F2 16 Tf 0.07 0.09 0.13 rg");
			cmds.push(`1 0 0 1 ${marginX} ${pageHeight - 54} Tm`);
			cmds.push(`(${escapePdfLiteral(sanitizePdfText(title))}) Tj`);
			cmds.push("ET");

			if (subtitle) {
				cmds.push("BT");
				cmds.push("/F1 9.5 Tf 0.35 0.39 0.45 rg");
				cmds.push(`1 0 0 1 ${marginX} ${pageHeight - 70} Tm`);
				cmds.push(`(${escapePdfLiteral(fitCellText(subtitle, usableWidth, 9.5))}) Tj`);
				cmds.push("ET");
			}

			// Metadata strip box
			cmds.push("0.96 0.97 0.98 rg");
			cmds.push(`${marginX} ${pageHeight - 114} ${usableWidth} 32 re f`);
			cmds.push("0.86 0.88 0.91 RG 0.6 w");
			cmds.push(`${marginX} ${pageHeight - 114} ${usableWidth} 32 re S`);

			const metaList = [
				...metadata,
				{ label: "Total Records", value: String(rows.length) },
			].slice(0, 4);
			const metaStep = usableWidth / Math.max(1, metaList.length);
			metaList.forEach((item, idx) => {
				const mx = marginX + 10 + idx * metaStep;
				cmds.push("BT");
				cmds.push("/F2 7.5 Tf 0.40 0.44 0.50 rg");
				cmds.push(`1 0 0 1 ${mx.toFixed(1)} ${pageHeight - 94} Tm`);
				cmds.push(`(${escapePdfLiteral(sanitizePdfText(item.label.toUpperCase()))}) Tj`);
				cmds.push("ET");

				cmds.push("BT");
				cmds.push("/F1 9 Tf 0.09 0.11 0.15 rg");
				cmds.push(`1 0 0 1 ${mx.toFixed(1)} ${pageHeight - 107} Tm`);
				cmds.push(`(${escapePdfLiteral(fitCellText(item.value, metaStep - 14, 9))}) Tj`);
				cmds.push("ET");
			});
		} else {
			cmds.push("BT");
			cmds.push("/F2 11 Tf 0.07 0.09 0.13 rg");
			cmds.push(`1 0 0 1 ${marginX} ${pageHeight - 52} Tm`);
			cmds.push(`(${escapePdfLiteral(`${sanitizePdfText(title)} (Continued)`)}) Tj`);
			cmds.push("ET");
		}

		// Table header bar
		const tableTop = isFirst ? firstPageTop : nextPageTop;
		const headerBottom = tableTop - headerBarHeight;
		cmds.push("0.92 0.94 0.96 rg");
		cmds.push(`${marginX} ${headerBottom} ${usableWidth} ${headerBarHeight} re f`);
		cmds.push("0.80 0.83 0.87 RG 0.6 w");
		cmds.push(`${marginX} ${headerBottom} m ${pageWidth - marginX} ${headerBottom} l S`);
		cmds.push(`${marginX} ${tableTop} m ${pageWidth - marginX} ${tableTop} l S`);

		let colX = marginX;
		columns.forEach((col, cIdx) => {
			const w = colWidths[cIdx];
			const headerText = fitCellText(col.header, w, 8.5);
			const textX =
				col.align === "right"
					? colX + w - 6 - headerText.length * 4.7
					: colX + 6;
			cmds.push("BT");
			cmds.push("/F2 8.5 Tf 0.12 0.15 0.20 rg");
			cmds.push(`1 0 0 1 ${Math.max(colX + 4, textX).toFixed(1)} ${headerBottom + 7} Tm`);
			cmds.push(`(${escapePdfLiteral(headerText)}) Tj`);
			cmds.push("ET");
			colX += w;
		});

		// Rows
		if (pageRows.length === 0) {
			cmds.push("BT");
			cmds.push("/F1 9 Tf 0.45 0.48 0.53 rg");
			cmds.push(`1 0 0 1 ${marginX + 8} ${headerBottom - 22} Tm`);
			cmds.push("(No records match the current filters.) Tj");
			cmds.push("ET");
		} else {
			pageRows.forEach((row, rIdx) => {
				const rowBottom = headerBottom - (rIdx + 1) * rowHeight;
				if (rIdx % 2 === 1) {
					cmds.push("0.985 0.987 0.992 rg");
					cmds.push(`${marginX} ${rowBottom} ${usableWidth} ${rowHeight} re f`);
				}
				cmds.push("0.90 0.92 0.94 RG 0.4 w");
				cmds.push(`${marginX} ${rowBottom} m ${pageWidth - marginX} ${rowBottom} l S`);

				let cellX = marginX;
				columns.forEach((col, cIdx) => {
					const w = colWidths[cIdx];
					const val = row[cIdx] ?? "";
					const text = fitCellText(val, w, 8);
					const textX =
						col.align === "right"
							? cellX + w - 6 - text.length * 4.3
							: cellX + 6;
					cmds.push("BT");
					cmds.push("/F1 8 Tf 0.16 0.19 0.24 rg");
					cmds.push(
						`1 0 0 1 ${Math.max(cellX + 4, textX).toFixed(1)} ${rowBottom + 6.5} Tm`
					);
					cmds.push(`(${escapePdfLiteral(text)}) Tj`);
					cmds.push("ET");
					cellX += w;
				});
			});
		}

		// Footer
		cmds.push("0.85 0.87 0.90 RG 0.5 w");
		cmds.push(`${marginX} 30 m ${pageWidth - marginX} 30 l S`);
		cmds.push("BT");
		cmds.push("/F1 8 Tf 0.45 0.48 0.53 rg");
		cmds.push(`1 0 0 1 ${marginX} 18 Tm`);
		cmds.push("(Hamzet Wasel Dashboard - Compliance Reporting Export) Tj");
		cmds.push("ET");

		cmds.push("BT");
		cmds.push("/F1 8 Tf 0.45 0.48 0.53 rg");
		cmds.push(`1 0 0 1 ${pageWidth - marginX - 58} 18 Tm`);
		cmds.push(`(${escapePdfLiteral(`Page ${pageIndex + 1} of ${totalPages}`)}) Tj`);
		cmds.push("ET");

		return cmds.join("\n");
	});

	// Build PDF objects:
	// 1: Catalog, 2: Pages, 3: Helvetica (/F1), 4: Helvetica-Bold (/F2),
	// 5..(5 + totalPages - 1): Page objects, (5 + totalPages)..: Content streams
	const objects: string[] = [];
	const pageObjectIds: number[] = [];
	const firstPageObjId = 5;
	const firstContentObjId = firstPageObjId + totalPages;

	for (let i = 0; i < totalPages; i++) {
		pageObjectIds.push(firstPageObjId + i);
	}

	objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
	objects.push(
		`2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds
			.map((id) => `${id} 0 R`)
			.join(" ")}] /Count ${totalPages} >>\nendobj\n`
	);
	objects.push(
		"3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n"
	);
	objects.push(
		"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n"
	);

	for (let i = 0; i < totalPages; i++) {
		const pageId = firstPageObjId + i;
		const contentId = firstContentObjId + i;
		objects.push(
			`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
		);
	}

	const encoder = new TextEncoder();
	for (let i = 0; i < totalPages; i++) {
		const contentId = firstContentObjId + i;
		const stream = contentStreams[i];
		const byteLen = encoder.encode(stream).length;
		objects.push(
			`${contentId} 0 obj\n<< /Length ${byteLen} >>\nstream\n${stream}\nendstream\nendobj\n`
		);
	}

	const chunks: Uint8Array[] = [];
	const header = encoder.encode("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
	chunks.push(header);
	let currentOffset = header.length;

	const offsets: number[] = [0];
	for (const objStr of objects) {
		offsets.push(currentOffset);
		const objBytes = encoder.encode(objStr);
		chunks.push(objBytes);
		currentOffset += objBytes.length;
	}

	const xrefOffset = currentOffset;
	const xrefLines = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`];
	for (let i = 1; i <= objects.length; i++) {
		xrefLines.push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
	}
	const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
	chunks.push(encoder.encode(xrefLines.join("") + trailer));

	const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
	link.click();
	URL.revokeObjectURL(url);
}
