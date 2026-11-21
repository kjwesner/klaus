
# KLAUS Maschinenbau · Precision in Motion

Eigenständiger, unveröffentlichter Relaunch-Entwurf für KLAUS-MASCHINENBAU. Die Anwendung läuft lokal, speichert eingehende Anfragen und Änderungen an Website-Inhalten dauerhaft in SQLite. Sie ist noch nicht auf einer öffentlichen Domain bereitgestellt und kein offizieller Unternehmensauftritt.

## Start unter Windows

Voraussetzung: Node.js 24 oder neuer. Einmal die PDF.js-Abhängigkeit installieren, dann den Server starten:

```powershell
npm install
node server.mjs
```

Dann [http://127.0.0.1:4173/de](http://127.0.0.1:4173/de) im Browser öffnen. `/admin` leitet beim ersten Aufruf zur Einrichtung des ersten Administrator-Kontos weiter. Danach melden sich Administratoren mit E-Mail und Passwort an. Manrope, Three.js und Medien werden lokal ausgeliefert. Zum Beenden im Terminal `Strg+C` drücken.

### Lokaler KI-Assistent

Das Kundenportal startet mit einem kurzen Frageablauf und wechselt danach in ein Chatfenster mit **Karl Johann AI**. Der Chat unterstützt Bilder (PNG/JPG/WebP), PDFs sowie TXT, MD, CSV, JSON und DXF. Bilder werden vom lokalen Vision-Modell verarbeitet; PDF-Text wird lokal extrahiert. Installiere Ollama für Windows und lade die beiden Modelle einmal herunter:

```powershell
ollama pull qwen3:4b
ollama pull qwen3.5:2b
```

Ollama muss während der Nutzung laufen. Der Chat wechselt je nach Nachricht zwischen den lokalen Text- und Vision-Modellen. Die Modelle werden nicht mit KLAUS-Daten trainiert; die Website gibt dem Assistenten einen eigenen Namen und Regeln. Nachrichten und Anhänge gehen nur an den lokalen Ollama-Prozess auf diesem Rechner. Modellnamen lassen sich über `KJ_AI_MODEL` und `KJ_AI_VISION_MODEL` in `.env` ändern.

| Einstieg | Vorführung |
|---|---|
| [/de](http://127.0.0.1:4173/de) | Startseite, Leistungsdetails, Maschinenfilter, Unternehmensgeschichte und interaktives 3D-Studio |
| [/de/anfrage](http://127.0.0.1:4173/de/anfrage) | Sechs Schritte, DXF-Linienvorschau, Testdateien und Vorgangsnummer |
| [/de/portal](http://127.0.0.1:4173/de/portal) | Kundenportal öffnet Frageablauf und lokalen KI-Chat ohne Kundenkonto |
| [/de/verwaltung](http://127.0.0.1:4173/de/verwaltung) | „Administration“ oder eine Fachrolle wählen; Zugriff hängt von der Rolle ab |
| [/de/karriere](http://127.0.0.1:4173/de/karriere) | Stellenseite mit Testbewerbung und PDF-Upload |

Projektanfragen akzeptieren normale E-Mail-Adressen und erscheinen dauerhaft unter *Verwaltung → Anfragen*. Administratoren können sie dort prüfen, zuweisen, kommentieren und den Status ändern. Unter *Verwaltung → Konten & Rollen* lassen sich echte Konten mit individuellen Passwörtern anlegen. Der lokale Postausgang speichert Benachrichtigungen; ein E-Mail-Anbieter ist noch nicht verbunden.

Die lokale Erstkonfiguration ist nur auf dem Rechner erreichbar, auf dem der Server läuft. Setze für den ersten Administrator ein starkes Passwort. Weitere Konten werden von einem eingeloggten Administrator angelegt. Passwörter werden mit Scrypt gehasht. Reset- und Benachrichtigungslinks landen im lokalen Postausgang; sie werden ohne Mailanbieter nicht automatisch versendet.

## Architektur und Daten

- Node HTTP mit serverseitig gerenderten, zweisprachigen Seiten und kleinen Browser-Modulen. Dieser Stack vermeidet einen separaten Build und externe Installationsdienste und erleichtert eine Vorführung auf einem einzelnen Rechner.
- Relationale SQLite-Datenbank über `node:sqlite`. Die Initialmigration unter `db/001-init.sql` und die Seed-Daten starten automatisch. Windows-Standard: `%LOCALAPPDATA%\KlausConcept\<Kennung des Checkouts>`, außerhalb des OneDrive-Projektordners. Andere Systeme: `~/.local/share/KlausConcept/<Kennung>`. SQLite verwendet WAL; Sicherungen nur bei gestopptem Server bzw. über ein geeignetes SQLite-Backup anlegen.
- Öffentliche Inhalte für Leistungen, Maschinen, Referenzen, Stellen und redaktionelle Unternehmensseiten kommen aus veröffentlichten CMS-Datensätzen. Der Entwurf, die freigegebene Version und Revisionen werden getrennt gespeichert. Die Hero-Überschrift, Einleitung, Eyebrow und das Hintergrundbild der Startseite lassen sich über Verwaltung → CMS → Startseite ändern. Inhalte für Leistungen, Maschinen, Projekte, Stellen und Unternehmensseiten sind im CMS zweisprachig bearbeitbar. Die Medienbibliothek nimmt PNG-, JPEG- und WebP-Bilder bis 5 MB auf; diese Bilder können anschließend Inhalten zugewiesen werden.
- Three.js lädt erst auf Anforderung. Beide Modelle sind schematisch; der Maschinenviewer bietet Kamerapositionen, Rotation, Zoom und Hotspots. Der Baugruppenviewer bietet eine manuell steuerbare Explosionsansicht. Das Seitenscrollen verändert das Modell nicht.
- Technische Daten und Medienherkunft sind in [Recherche und Medien](docs/RECHERCHE.md) dokumentiert. Lokaler Betrieb und offene Produktionsintegrationen stehen in [Betrieb und Freigaben](docs/BETRIEB.md).

## Konfiguration, Tests und Reset

`.env.example` kann nach `.env` kopiert werden. Mit `node --env-file-if-exists=.env server.mjs` werden die Variablen geladen. Unterstützt werden `PORT` (Standard 4173), `DEMO_DATA_DIR` (absoluter Demo-Datenpfad), `CLAMD_HOST` und `CLAMD_PORT` (optionale Virenprüfung; Standard-Port 3310). Der Server ist an die Loopback-Adresse gebunden. Andere Betriebsmodi als `demo` werden abgelehnt.

```powershell
node --test
node --env-file-if-exists=.env scripts/purge.mjs
```

Die Tests verwenden einen eigenen temporären Server und eine separate Datenbank. Sie prüfen beide Sprachversionen, Filter und Routen sowie Anfrage, Bewerbungen, Upload, Rollen, Mandantentrennung, CMS-Freigabe, Passwort-Reset und Sitzungsentzug. Die lokale Bereinigung entfernt abgelaufene Demo-Bewerbungen samt Anlagen und alte Postausgangseinträge. Die Frist ist in der Verwaltung einstellbar.

Für einen vollständigen Demo-Reset zuerst den Server stoppen, dann ausführen:

```powershell
node --env-file-if-exists=.env scripts/reset.mjs --confirm-local-demo
```

Das löscht die lokale Demo-Datenbank einschließlich eigener Testvorgänge und CMS-Änderungen. Der nächste Start legt die ursprünglichen Beispieldaten neu an.

Ein Deployment ist nicht Teil dieser Demo. Den lokalen Server weder öffentlich weiterleiten noch hinter einen öffentlich erreichbaren Reverse Proxy stellen.

