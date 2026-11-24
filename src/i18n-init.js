// Shared i18next setup for both modes (tally and cards).
// Language order: ?lng= query, saved choice (localStorage / cookie), otherwise English.
// Missing keys always fall back to English, so incomplete translations never show raw keys.

const SUPPORTED_LANGUAGES = ['en', 'pl', 'de', 'es', 'nl', 'pt'];
const DEFAULT_LANGUAGE = 'en';

function initI18n(onReady) {
    const detector = new i18nextBrowserLanguageDetector();
    detector.addDetector({
        name: 'defaultLanguage',
        lookup: () => DEFAULT_LANGUAGE,
        cacheUserLanguage: () => { }
    });

    i18next
        .use(detector)
        .use(i18nextHttpBackend)
        .init({
            fallbackLng: 'en',
            whitelist: SUPPORTED_LANGUAGES,
            saveMissing: false,
            detection: {
                order: ['querystring', 'localStorage', 'cookie', 'defaultLanguage'],
                caches: ['localStorage', 'cookie']
            },
            backend: {
                loadPath: 'i18n/{{lng}}/{{ns}}.json'
            }
        }, function (err, t) {
            document.documentElement.lang = i18next.language;
            onReady(err, t);
        });
}
