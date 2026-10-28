# Test czasu reakcji

Strona do badania: dominujące oko a czas reakcji po lewej/prawej stronie. Specyfikacja: `specyfikacja.md`.

## Pliki

1. `index.html` — cała strona (jeden plik, bez instalacji).
2. `apps-script.gs` — skrypt do arkusza Google, który przyjmuje wyniki.

## Uruchomienie lokalnie

Otwórz `index.html` w przeglądarce. Bez ustawionego `SHEET_URL_B64` wyniki pobierają się tylko do pliku CSV.

## Podpięcie arkusza (najpierw Twoje konto, docelowo Zuzy)

1. Nowy Google Sheet → Rozszerzenia → Apps Script.
2. Wklej zawartość `apps-script.gs`, zapisz.
3. Wdróż → Nowe wdrożenie → typ: Aplikacja internetowa. Wykonaj jako: ja. Kto ma dostęp: Każdy.
4. Zatwierdź uprawnienia, skopiuj URL wdrożenia (kończy się na `/exec`).
5. Zakoduj URL: `echo -n 'https://script.google.com/...' | base64 -w0` i wklej wynik do `SHEET_URL_B64` na górze skryptu w `index.html`.

Zakładki `wyniki` i `surowe` utworzą się same przy pierwszej sesji. Po każdej zmianie skryptu: Wdróż → Zarządzaj wdrożeniami → edytuj → nowa wersja (wtedy URL zostaje ten sam).

## Publikacja (GitHub Pages)

1. Repo z `index.html` → Settings → Pages → Deploy from branch → `main` / root.
2. Strona pod `https://<user>.github.io/<repo>/`.

## Przebieg testu

1. Pseudonim (+ opcjonalnie ustawienia czasów, zapamiętywane w przeglądarce) → Dalej.
2. Instrukcja → spacja → test na pełnym ekranie.
3. Każda próba: przerwa → czerwony „!” na chwilę → pusty ekran → kółko po lewej/prawej (stały odstęp od „!”) → klawisz A/D lub ←/→.
4. Klawisze przed pojawieniem się kółka są ignorowane. Zły klawisz = błąd z czasem, kółko zostaje do poprawnej reakcji.
5. Esc albo wyjście z pełnego ekranu przerywa test (zapisują się ukończone próby, `ukonczony = 0`).
6. Na koniec wysyłka do arkusza. Jeśli się nie uda: wyniki zostają w przeglądarce (wysyłka ponawiana przy kolejnej sesji) i pobiera się CSV.

## Kolumny

`surowe` — jedna próba na wiersz: `blad` 0/1, czasy w ms od pojawienia się obiektu (`czas_poprawnej_reakcji_ms` = czas do dobrego klawisza), `zestaw_klawiszy` AD/strzalki.

`wyniki` — jedna sesja na wiersz: średnie L/P ze wszystkich prób (czas poprawnej reakcji) i tylko z prób bez błędu, liczba błędów L/P, ustawienia.

Nazwy kolumn bez polskich znaków i spacji, żeby bez problemu wczytać je do SPSS/R.
