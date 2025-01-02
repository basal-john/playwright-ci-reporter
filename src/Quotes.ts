export const FAILURE_QUOTES = [
    '“Houston, we have a problem.” - Apollo 13',
    '“Failure is not an option.” - Apollo 13',
    '“Why so serious?” - The Dark Knight',
    '“I find your lack of passing disturbing.” - Darth Vader',
    "“It's not a bug, it's a feature!” - Every developer ever",
    'Oh, crap, it failed! But it worked on my machine!',
    "Tests won't fail if you have no tests!",
    'PLEASE LET ME MERGE BEFORE I START CRYING!',
    '“You can’t handle the truth!” - A Few Good Men',
];

export const SUCCESS_QUOTES = [
    '“Hasta la vista, baby.” - The Terminator',
    '“All systems go!” - NASA',
    '“That’s one small step for man, one giant leap for… tests!” - Apollo 11',
    '“Victory is ours!” - Braveheart',
    "“I'm king of the world!” - Titanic",
    '“You’re a wizard, Harry!” - Harry Potter',
    '“Live long and prosper.” - Star Trek',
];

/**
 * Returns a random quote from the provided list.
 * @param {string[]} quotes - Array of quotes to choose from.
 * @returns {string} A random quote.
 */
export function getRandomQuote(quotes: string[]): string {
    return quotes[Math.floor(Math.random() * quotes.length)];
}
