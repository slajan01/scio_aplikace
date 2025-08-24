# Aplikace SCIO

Toto je prototyp webové aplikace pro real-time sledování pokroku skupiny studentů učitelem. Aplikace využívá umělou inteligenci pro analýzu odpovědí a automatické vyhodnocování plnění cílů.

**Live Demo:** [scio-aplikace.vercel.app](https://scio-aplikace.vercel.app/)

---

## Klíčové Funkce

### Pro Učitele

* **Autentizace:** Bezpečné přihlášení / registrace pomocí Google účtu.
* **Správa skupin:** Možnost vytvořit novou studijní skupinu s definovaným názvem a cílem.
* **Přehled skupin:** Tabulkový přehled všech vytvořených skupin.
* **Real-time nástěnka:** Po otevření detailu skupiny učitel vidí živý přehled všech připojených studentů, jejich aktuální pokrok a indikátor, pokud potřebují pomoc.
* **Pozvánky pro studenty:** Učitel může pro každou skupinu jednoduše zobrazit QR kód a odkaz pro připojení studentů.
* **Detailní vhled:** Možnost rozkliknout detail studenta a zobrazit si seznam jeho klíčových zpráv, které vedly k pokroku.

### Pro Studenty

* **Jednoduchý vstup:** Připojení do skupiny naskenováním QR kódu nebo přes unikátní odkaz, bez nutnosti registrace. Student zadává pouze svou přezdívku.
* **Interaktivní chat:** Komunikace probíhá formou textového chatu.
* **Podpora formátování:** Chat podporuje zobrazení matematických vzorců (LaTeX) a bloků kódu pomocí Markdownu.
* **Hlasové zadávání:** Studenti mohou své odpovědi pohodlně diktovat pomocí mikrofonu.
* **Okamžitá zpětná vazba:** AI analyzuje každou zprávu, poskytuje krátkou zpětnou vazbu a relevantní zprávy vizuálně zvýrazní.
* **Sledování vlastního pokroku:** Student na obrazovce neustále vidí svůj aktuální pokrok v plnění cíle na přehledném progress baru.

---

## Jak funguje logika pokroku a cílů?

Jádrem aplikace je inteligentní mechanismus pro vyhodnocování pokroku, který kombinuje data z databáze a analýzu pomocí AI.

1.  **Stanovení cílů:**
    * Když učitel vytvoří novou skupinu, aplikace v databázi automaticky založí jeden hlavní cíl typu "splněno na %".
    * V současné prototypové verzi je počet kroků k cíli nastaven napevno na **3** (např. vyřešení 3 úkolů). V budoucnu by tento počet mohla určovat AI z popisu cíle nebo by ho zadával učitel ručně.

2.  **Analýza a naplnění pokroku:**
    * Student napíše (nebo namluví) zprávu a odešle ji.
    * WebSocket server zprávu přijme a předá ji společně s kontextem (cíl skupiny, aktuální pokrok studenta) na analýzu umělé inteligenci (Google Gemini).
    * Součástí příkazu (promptu) pro AI je instrukce, aby posoudila, zda zpráva představuje splnění dalšího kroku v zadaném cíli.
    * AI vrátí odpověď ve formátu JSON, která obsahuje klíč `progressIncrement` (s hodnotou `1` pro posun vpřed, jinak `0`).
    * Pokud AI udělí bod, server aktualizuje stav pokroku studenta v databázi.
    * Nakonec server rozešle všem v místnosti (studentovi i učiteli) zprávu, která obsahuje jak text z chatu, tak i **nový, aktualizovaný stav pokroku**, který se okamžitě projeví na progress barech.

V jednoduchosti: **AI funguje jako rozhodčí**, který po každé zprávě posoudí, jestli si student zaslouží bod k dobru.

---

## Použité Technologie

* **Framework:** [Nuxt 3](https://nuxt.com/)
* **Hosting & Deployment:** [Vercel](https://vercel.com/)
* **Databáze a Autentizace:** [Supabase](https://supabase.com/) (PostgreSQL)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Real-time komunikace:** [Nitro WebSockets](https://nitro.unjs.io/guide/websocket)
* **UI Komponenty:** [Nuxt UI](https://ui.nuxt.com/)
* **Stylování:** [Tailwind CSS](https://tailwindcss.com/)
* **AI Model:** [Google Gemini API](https://ai.google.dev/)

---

## Lokální spuštění projektu

1.  **Naklonujte repozitář:**
    ```bash
    git clone [https://github.com/slajan01/scio_aplikace.git](https://github.com/slajan01/scio_aplikace.git)
    cd scio_aplikace
    ```

2.  **Nainstalujte závislosti:**
    ```bash
    npm install
    ```

3.  **Nastavte environment variables:**
    * Vytvořte v kořenovém adresáři soubor `.env`.
    * Zkopírujte do něj obsah ze souboru `.env.example` (pokud existuje) nebo vložte své vlastní klíče:
        ```
        SUPABASE_URL="VAŠE_SUPABASE_URL"
        SUPABASE_KEY="VÁŠ_SUPABASE_ANON_KEY"
        DATABASE_URL="VÁŠ_PŘIPOJOVACÍ_ŘETĚZEC_K_DATABÁZI"
        GEMINI_API_KEY="VÁŠ_GEMINI_API_KLÍČ"
        ```

4.  **Spusťte migraci databáze:**
    ```bash
    npx drizzle-kit push
    ```

5.  **Spusťte vývojový server:**
    ```bash
    npm run dev
    ```

Aplikace poběží na adrese `http://localhost:3000`.
