# Verifikation der lokalen Demo

Geprüft am 17. November 2026. Testdaten und Testkonten sind fiktiv.

- Browser bei 1440 und 390 Pixeln: Startseite, geladenes CNC-Motiv, Navigation innerhalb der verfügbaren Breite, mobiles Menü per Tastatur und Wechsel auf Englisch.
- 3D: WebGL-Modell lädt auf Anforderung; Kameraposition ist über die Ansichtsschaltflächen steuerbar, Seitenscrollen verändert das Modell nicht.
- Anfrage im Browser: alle sechs Schritte bis zur Bestätigung mit Vorgangsnummer. Dieselbe Anfrage erschien anschließend mit Status „Eingegangen“ in der Verwaltung.
- `node --test`: sechs Tests erfolgreich. Abgedeckt sind 44 öffentliche bzw. Login-Routen in beiden Sprachen, Maschinenfilter, Anfrage mit DXF, Fehlerfälle, fremde Projekte und geschützte Dokumente, CMS-Freigabe und Entwurfsgrenzen, Personalzugriff und Anhangslöschung sowie Einladungs- und Reset-Tokens.
- Nicht gemessen: Core Web Vitals auf realen Zielgeräten, vollständige WCAG-Prüfung, Lasttest, produktives Monitoring und unabhängiger Sicherheitstest. ClamAV und externe Mailzustellung waren nicht verbunden.

