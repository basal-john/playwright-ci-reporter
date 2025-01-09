export const FAILURE_QUOTES = [
    "Test failed successfully! Wait, that's not right...",
    'I find your lack of passing disturbing. - Darth Vader',
    "It's not a bug, it's an unplanned feature!",
    '404: Success not found',
    "Looks like we're gonna need a bigger test suite - Jaws",
    'May the tests be ever in your favor - Hunger Games',
    'To err is human, to test is divine',
    'Keep calm and write more tests',
    "Tests: 'I'll be back... failing' - Terminator",
    'The first rule of Test Club: Always talk about Test Club - Fight Club',
    'Houston, we have a testing problem - Apollo 13',
    "You can't handle the test! - A Few Good Men",
    "I'm going to make you a test you can't refuse - The Godfather",
    'Say hello to my little test! - Scarface',
    'Hasta la vista, failing test - Terminator 2',
    'Why so failing? - The Dark Knight',
    'Do you want to build a test suite? - Frozen',
    "Life is like a box of tests, you never know what you're gonna get - Forrest Gump",
    'With great tests comes great responsibility - Spider-Man',
    "Tests? Where we're going, we don't need tests! - Back to the Future",
];

export const SUCCESS_QUOTES = [
    'Test passed! This is the way. - The Mandalorian',
    'All your tests are belong to pass',
    'Mission Possible: All Tests Passed - Mission Impossible',
    'Tests: Achievement Unlocked! 🏆',
    'You shall pass! - Gandalf the Test Master',
    'May the tests be with you - Star Wars',
    'Testing? Completed it, mate!',
    'Another test bites the dust... successfully! - Queen',
    'Tests passed faster than a speeding bullet - Superman',
    'Hakuna Matesta: It means no failures - Lion King',
    'I am the one who tests! - Breaking Bad',
    'To infinity and beyond these tests! - Toy Story',
    'I feel the need... the need for test speed! - Top Gun',
    'Mama always said testing was like a box of chocolates - Forrest Gump',
    "Here's looking at you, passing test - Casablanca",
    'Nobody puts testing in a corner - Dirty Dancing',
    'I see passing tests - The Sixth Sense',
    "You had me at 'test passed' - Jerry Maguire",
    "I'm the king of the testing world! - Titanic",
    'Elementary, my dear test suite - Sherlock Holmes',
];

/**
 * Returns a random quote from the provided list.
 * @param {string[]} quotes - Array of quotes to choose from.
 * @returns {string} A random quote.
 */
export function getRandomQuote(quotes: string[]): string {
    return quotes[Math.floor(Math.random() * quotes.length)];
}
