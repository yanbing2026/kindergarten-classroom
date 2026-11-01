// Grade 1 core-subject extension bank.
// The original four questions per unit are in ela.js / science.js /
// social-studies.js / writing.js. These add four more per unit so every unit
// has at least eight questions and replaying a unit is not identical.
window.KC_G1_EXTRA = {
  ela: {
    "Phonics & Word Reading": [
      {title: "Ending sounds", prompt: "Which word ends with the /t/ sound?", choices: ["cat", "dog", "sun", "cup"], answer: "cat", hint: "Say the last sound in each word.", explanation: "Cat ends with the /t/ sound."},
      {title: "Digraphs", prompt: "Which word begins with the /sh/ sound?", choices: ["ship", "tap", "map", "bug"], answer: "ship", hint: "Two letters can make one sound.", explanation: "The letters sh make the /sh/ sound in ship."},
      {title: "Two-syllable words", prompt: "Which word has two syllables?", choices: ["rabbit", "cat", "dog", "fish"], answer: "rabbit", hint: "Clap the beats in each word.", explanation: "Rab-bit has two beats, or syllables."},
      {title: "Rhyming words", prompt: "Which word rhymes with cake?", choices: ["lake", "cup", "dog", "sun"], answer: "lake", hint: "Rhyming words end with the same sound.", explanation: "Cake and lake both end with the /ake/ sound."}
    ],
    "Reading Fluency & Comprehension": [
      {title: "Retell a story", prompt: "What should you tell first when you retell a story?", choices: ["What happened at the beginning", "The last word", "Only the title", "Your favorite color"], answer: "What happened at the beginning", hint: "Stories have a beginning, middle, and end.", explanation: "A retell starts with the beginning of the story."},
      {title: "Character feelings", prompt: "Mia smiled and hugged her friend. How does Mia feel?", choices: ["happy", "angry", "sleepy", "afraid"], answer: "happy", hint: "Think about what smiling shows.", explanation: "Smiling and hugging show that Mia feels happy."},
      {title: "Compare texts", prompt: "Two books are about dogs. What can you compare?", choices: ["What each book teaches", "The color of your shoes", "Your lunch", "The weather tomorrow"], answer: "What each book teaches", hint: "Compare the information in both books.", explanation: "You can compare the facts and ideas in each book."},
      {title: "Answer from text", prompt: "Where should you look to answer a question about a story?", choices: ["In the story", "Under the table", "In your pocket", "At the sky"], answer: "In the story", hint: "Good readers go back to the text.", explanation: "The story contains the evidence you need."}
    ],
    "Vocabulary & Language": [
      {title: "Multiple-meaning words", prompt: "Which sentence uses bat to mean a baseball tool?", choices: ["He hit the ball with a bat.", "A bat flew at night.", "The bat slept in a cave.", "I saw a bat in the tree."], answer: "He hit the ball with a bat.", hint: "One word can have more than one meaning.", explanation: "In this sentence, bat means the tool used in baseball."},
      {title: "Shades of meaning", prompt: "Which word is stronger than happy?", choices: ["thrilled", "okay", "fine", "calm"], answer: "thrilled", hint: "Which word shows a bigger feeling?", explanation: "Thrilled is a stronger feeling than happy."},
      {title: "Prefixes", prompt: "What does the prefix un- mean in unhappy?", choices: ["not", "again", "before", "very"], answer: "not", hint: "Unhappy means not happy.", explanation: "The prefix un- means not."},
      {title: "Using a dictionary", prompt: "What can a dictionary help you find?", choices: ["A word's meaning", "A lost toy", "Tomorrow's weather", "A friend's phone number"], answer: "A word's meaning", hint: "Think about a book of words.", explanation: "A dictionary explains what words mean."}
    ],
    "Grammar, Sentences & Conventions": [
      {title: "Adjectives", prompt: "Which word is an adjective in the sentence: The red ball bounced?", choices: ["red", "ball", "bounced", "The"], answer: "red", hint: "An adjective describes a noun.", explanation: "Red describes the ball, so it is an adjective."},
      {title: "Subject-verb agreement", prompt: "Which sentence uses the verb correctly?", choices: ["The dog runs fast.", "The dog run fast.", "The dogs runs fast.", "The dog running fast."], answer: "The dog runs fast.", hint: "Match the verb to the subject.", explanation: "A singular subject takes runs."},
      {title: "Question marks", prompt: "Which sentence needs a question mark?", choices: ["Where is my hat", "I like my hat", "My hat is red", "Put on your hat"], answer: "Where is my hat", hint: "A question asks something.", explanation: "Where is my hat asks a question, so it needs a question mark."},
      {title: "Commas in a list", prompt: "Which sentence uses commas correctly?", choices: ["I packed apples, grapes, and cheese.", "I packed apples grapes and, cheese.", "I packed, apples grapes and cheese.", "I packed apples, grapes and, cheese."], answer: "I packed apples, grapes, and cheese.", hint: "Put a comma between items in a list.", explanation: "Commas separate the three items in the list."}
    ],
    "Writing & Response": [
      {title: "Narrative opening", prompt: "Which is a good opening for a story?", choices: ["One sunny morning, Leo found a map.", "The end.", "I will now list facts.", "First, second, third."], answer: "One sunny morning, Leo found a map.", hint: "A story opening introduces people and action.", explanation: "It names a character and starts the action."},
      {title: "Informative sentence", prompt: "Which sentence gives a fact about frogs?", choices: ["Frogs live near water.", "Frogs are the best.", "I like frogs.", "Please buy a frog."], answer: "Frogs live near water.", hint: "A fact can be checked.", explanation: "Frogs living near water is a fact you can check."},
      {title: "Opinion reason", prompt: "Which sentence gives a reason for an opinion?", choices: ["I like parks because they have swings.", "Parks are parks.", "I do not know.", "The park is there."], answer: "I like parks because they have swings.", hint: "The word because often introduces a reason.", explanation: "Because they have swings gives a reason."},
      {title: "Edit for capitals", prompt: "Which sentence has correct capitalization?", choices: ["We met Ms. Lee on Monday.", "we met ms. lee on monday.", "We Met ms. Lee On monday.", "we Met Ms. lee on Monday."], answer: "We met Ms. Lee on Monday.", hint: "Capitalize names, titles, and days.", explanation: "The first word, Ms. Lee, and Monday are capitalized."}
    ],
    "Informational Reading & Research": [
      {title: "Parts of a book", prompt: "What does a table of contents show?", choices: ["Where each chapter starts", "The last page only", "The author's lunch", "How to draw"], answer: "Where each chapter starts", hint: "It lists the parts of a book.", explanation: "A table of contents lists chapters and their pages."},
      {title: "Use a diagram", prompt: "What can a labeled diagram help you learn?", choices: ["The parts of an object", "A secret code", "A song", "Your birthday"], answer: "The parts of an object", hint: "Labels point to pieces of a picture.", explanation: "Diagrams label parts so readers can understand them."},
      {title: "Compare two facts", prompt: "A bee lives in a hive. A bird lives in a nest. What is alike?", choices: ["Both have a home.", "Both live in water.", "Both are plants.", "Both are rocks."], answer: "Both have a home.", hint: "Look for what the two facts share.", explanation: "A hive and a nest are both animal homes."},
      {title: "Cite a source", prompt: "What should you name when you share a fact from a book?", choices: ["The book", "Your shoe size", "The weather", "Your favorite game"], answer: "The book", hint: "Tell where the fact came from.", explanation: "Naming the book shows where the fact came from."}
    ]
  },
  science: {
    "Living Things": [
      {title: "Basic needs", prompt: "What do all living things need?", choices: ["Food and water", "Only toys", "Only rocks", "Only darkness"], answer: "Food and water", hint: "Think about what people and animals need.", explanation: "Living things need food and water to survive."},
      {title: "Grow and change", prompt: "Which shows that a puppy is growing?", choices: ["It gets bigger.", "It stays the same size.", "It turns into a rock.", "It stops eating."], answer: "It gets bigger.", hint: "Growing means changing size.", explanation: "A growing puppy gets bigger over time."},
      {title: "Respond to the world", prompt: "A plant turns its leaves toward the sun. What does this show?", choices: ["It responds to light", "It is a rock", "It is sleeping", "It is made of metal"], answer: "It responds to light", hint: "The plant changes direction.", explanation: "The plant responds to the light from the sun."},
      {title: "Sort living and nonliving", prompt: "Which group is all nonliving?", choices: ["rock, chair, cup", "tree, bird, fish", "cat, dog, plant", "boy, girl, rabbit"], answer: "rock, chair, cup", hint: "Nonliving things do not grow or need food.", explanation: "Rocks, chairs, and cups are nonliving."}
    ],
    "Plants & Animals": [
      {title: "Pollination", prompt: "What helps many plants make seeds?", choices: ["Bees moving pollen", "Cars driving", "Rocks rolling", "Rain falling only"], answer: "Bees moving pollen", hint: "Insects visit flowers.", explanation: "Bees carry pollen between flowers, which helps make seeds."},
      {title: "Parents and offspring", prompt: "A calf is the young of which animal?", choices: ["cow", "cat", "bird", "fish"], answer: "cow", hint: "Think about farm animals.", explanation: "A calf is a young cow."},
      {title: "Camouflage", prompt: "Why might a green insect hide on a green leaf?", choices: ["To blend in", "To make noise", "To grow food", "To fly higher"], answer: "To blend in", hint: "Blending in helps animals stay safe.", explanation: "Its color helps it blend in with the leaf."},
      {title: "Food chains", prompt: "What does a rabbit eat in a food chain?", choices: ["plants", "rocks", "metal", "plastic"], answer: "plants", hint: "Rabbits are plant eaters.", explanation: "Rabbits eat plants, which gives them energy."}
    ],
    "Weather & Seasons": [
      {title: "Weather patterns", prompt: "Which tool measures how much rain fell?", choices: ["rain gauge", "ruler", "clock", "compass"], answer: "rain gauge", hint: "It collects rainwater.", explanation: "A rain gauge measures rainfall."},
      {title: "Seasonal clothing", prompt: "What should you wear on a cold winter day?", choices: ["a warm coat", "sandals", "a swimsuit", "shorts only"], answer: "a warm coat", hint: "Choose clothing that keeps you warm.", explanation: "A warm coat helps on a cold day."},
      {title: "Severe weather", prompt: "What should you do during a thunderstorm?", choices: ["Go indoors", "Stand under a tree", "Swim outside", "Fly a kite"], answer: "Go indoors", hint: "Stay safe from lightning.", explanation: "Going indoors is the safest choice during a thunderstorm."},
      {title: "Seasons in order", prompt: "Which season comes after winter?", choices: ["spring", "summer", "fall", "winter"], answer: "spring", hint: "Think about the order of the year.", explanation: "Spring comes after winter."}
    ],
    "Light & Sound": [
      {title: "Transparent or opaque", prompt: "Which material lets light pass through?", choices: ["clear glass", "wood", "brick", "metal"], answer: "clear glass", hint: "You can see through it.", explanation: "Clear glass lets light pass through."},
      {title: "Light and materials", prompt: "What happens when light hits a wall?", choices: ["It is blocked.", "It passes through.", "It turns into sound.", "It disappears forever."], answer: "It is blocked.", hint: "A wall is not transparent.", explanation: "The wall blocks the light and makes a shadow."},
      {title: "Vibration and pitch", prompt: "What happens to sound when vibrations are faster?", choices: ["The pitch is higher.", "The pitch is lower.", "There is no sound.", "The sound turns into light."], answer: "The pitch is higher.", hint: "Faster vibrations make a higher sound.", explanation: "Faster vibrations produce a higher pitch."},
      {title: "Echoes", prompt: "What causes an echo?", choices: ["Sound bouncing back", "Light bending", "Water freezing", "Wind stopping"], answer: "Sound bouncing back", hint: "Sound can reflect off a surface.", explanation: "An echo is sound that bounces back to your ears."}
    ],
    "Matter & Materials": [
      {title: "States of matter", prompt: "Which is a gas?", choices: ["air", "ice", "juice", "wood"], answer: "air", hint: "A gas fills the space around it.", explanation: "Air is a gas."},
      {title: "Reversible change", prompt: "Which change can be undone?", choices: ["melting ice", "burning paper", "cooking an egg", "baking bread"], answer: "melting ice", hint: "Freezing water again reverses melting.", explanation: "Melted ice can freeze back into ice."},
      {title: "Sink or float", prompt: "Which object will probably sink in water?", choices: ["a metal coin", "a leaf", "a cork", "a plastic lid"], answer: "a metal coin", hint: "Heavy, dense objects tend to sink.", explanation: "A metal coin is dense and sinks."},
      {title: "Properties sort", prompt: "Which property describes a rough surface?", choices: ["bumpy", "shiny", "clear", "loud"], answer: "bumpy", hint: "Think about how it feels.", explanation: "Bumpy describes a rough texture."}
    ],
    "Engineering & Investigation": [
      {title: "Measure results", prompt: "How can you compare two paper airplanes fairly?", choices: ["Measure how far each flies", "Guess the answer", "Change the rules each time", "Only test one plane"], answer: "Measure how far each flies", hint: "Use the same measurement for both.", explanation: "Measuring each flight gives a fair comparison."},
      {title: "Compare designs", prompt: "A bridge holds 5 blocks. Another holds 8. Which is stronger?", choices: ["the bridge that holds 8", "the bridge that holds 5", "both are the same", "neither bridge"], answer: "the bridge that holds 8", hint: "More blocks means more strength.", explanation: "The bridge holding 8 blocks is stronger."},
      {title: "Record data", prompt: "Where should you write your test results?", choices: ["in a science notebook", "on a shoe", "under a desk", "in the air"], answer: "in a science notebook", hint: "Keep results where you can read them later.", explanation: "A notebook keeps results organized."},
      {title: "Use evidence", prompt: "What should you use to explain why a design worked?", choices: ["Test results", "A guess", "A cartoon", "A wish"], answer: "Test results", hint: "Evidence comes from observations.", explanation: "Test results are evidence for your explanation."}
    ]
  },
  social: {
    "Families & Communities": [
      {title: "Family roles", prompt: "What is one way family members help each other?", choices: ["Sharing chores", "Ignoring each other", "Taking turns being unkind", "Never helping"], answer: "Sharing chores", hint: "Think about working together.", explanation: "Sharing chores is one way families help each other."},
      {title: "Community places", prompt: "Where do people go to borrow books?", choices: ["library", "bank", "gas station", "bakery"], answer: "library", hint: "It is full of books.", explanation: "A library lends books to community members."},
      {title: "Volunteering", prompt: "What does a volunteer do?", choices: ["Helps without pay", "Works only for money", "Stays home always", "Charges for every favor"], answer: "Helps without pay", hint: "Volunteers give their time.", explanation: "A volunteer helps others without being paid."},
      {title: "Celebrations", prompt: "Why do communities have celebrations?", choices: ["To share traditions", "To forget everyone", "To close all parks", "To stop helping"], answer: "To share traditions", hint: "Celebrations bring people together.", explanation: "Celebrations let people share traditions and time together."}
    ],
    "Maps & Places": [
      {title: "Map key", prompt: "What does a map key explain?", choices: ["What the symbols mean", "The weather", "The time", "How old the map is"], answer: "What the symbols mean", hint: "A key is like a word bank for a map.", explanation: "The map key explains each symbol."},
      {title: "Cardinal directions", prompt: "If you face north, which direction is behind you?", choices: ["south", "east", "west", "up"], answer: "south", hint: "North and south are opposites.", explanation: "South is opposite north."},
      {title: "Land and water", prompt: "Which color usually shows water on a map?", choices: ["blue", "green", "brown", "yellow"], answer: "blue", hint: "Think about oceans and lakes.", explanation: "Maps usually use blue for water."},
      {title: "Draw a route", prompt: "What should a route on a map show?", choices: ["How to get from one place to another", "Only the title", "A favorite food", "A bedtime story"], answer: "How to get from one place to another", hint: "A route is a path.", explanation: "A route shows the path between places."}
    ],
    "Rules & Government": [
      {title: "Home and school rules", prompt: "Why do homes and schools have rules?", choices: ["To keep people safe and fair", "To make everyone sad", "To stop all learning", "To hide the truth"], answer: "To keep people safe and fair", hint: "Rules help groups work together.", explanation: "Rules help keep people safe and treat each other fairly."},
      {title: "Laws", prompt: "What is a law?", choices: ["A rule made by a government", "A game", "A snack", "A story"], answer: "A rule made by a government", hint: "Laws apply to everyone in a community.", explanation: "A law is a rule made by a government."},
      {title: "Voting", prompt: "What does voting help a group do?", choices: ["Make a choice together", "Avoid all choices", "Pick without thinking", "Ignore everyone"], answer: "Make a choice together", hint: "People cast votes to decide.", explanation: "Voting is a way for a group to make a decision."},
      {title: "Services", prompt: "Which is a service a community provides?", choices: ["Fire safety", "A private toy", "A family photo", "A favorite snack"], answer: "Fire safety", hint: "Services help everyone in the community.", explanation: "Fire safety is a service that helps the whole community."}
    ],
    "History & Change": [
      {title: "Then and now", prompt: "Which object did people use before smartphones?", choices: ["a landline phone", "a tablet app", "a video call", "a text message"], answer: "a landline phone", hint: "Think about older technology.", explanation: "Landline phones came before smartphones."},
      {title: "Primary sources", prompt: "Which is a primary source about a family trip?", choices: ["A photo taken on the trip", "A made-up story", "A guess", "A cartoon about someone else"], answer: "A photo taken on the trip", hint: "A primary source comes from the event.", explanation: "A photo from the trip is a primary source."},
      {title: "Sequencing events", prompt: "Which happened first: a seed sprouted or a flower bloomed?", choices: ["The seed sprouted", "The flower bloomed", "They happened at once", "Neither happened"], answer: "The seed sprouted", hint: "A flower grows after a sprout.", explanation: "A seed sprouts before a flower blooms."},
      {title: "Community change", prompt: "How can a community change over time?", choices: ["New buildings are added", "Nothing ever changes", "People stop living there forever", "Maps disappear"], answer: "New buildings are added", hint: "Think about growth and building.", explanation: "Communities change as new buildings and services are added."}
    ],
    "Economics & Choices": [
      {title: "Spend or save", prompt: "What does saving money mean?", choices: ["Keeping it for later", "Spending it right away", "Losing it", "Giving it all away"], answer: "Keeping it for later", hint: "Saving is the opposite of spending now.", explanation: "Saving means keeping money to use later."},
      {title: "Wants and needs", prompt: "Which is a need?", choices: ["water", "a video game", "a toy car", "a candy bar"], answer: "water", hint: "Needs are necessary for life.", explanation: "Water is a need; the others are wants."},
      {title: "Producers", prompt: "Who is a producer?", choices: ["Someone who makes goods", "Someone who only buys", "Someone who sleeps", "Someone who hides"], answer: "Someone who makes goods", hint: "Producers create or grow things.", explanation: "A producer makes or grows goods."},
      {title: "Barter", prompt: "What is barter?", choices: ["Trading goods without money", "Saving all money", "Borrowing a book", "Counting coins"], answer: "Trading goods without money", hint: "Think about swapping.", explanation: "Barter is trading goods or services without using money."}
    ],
    "Culture & Citizenship": [
      {title: "Culture", prompt: "What is part of a family's culture?", choices: ["Food and traditions", "Only the weather", "A math problem", "A traffic light"], answer: "Food and traditions", hint: "Culture includes ways of living.", explanation: "Food and traditions are parts of culture."},
      {title: "Fairness", prompt: "What is a fair way to take turns?", choices: ["Use a rotating order", "Let one person always go first", "Skip some people", "Ignore the rules"], answer: "Use a rotating order", hint: "Fairness gives everyone a chance.", explanation: "A rotating order gives everyone a turn."},
      {title: "Helping the community", prompt: "Which action helps your community?", choices: ["Putting trash in a bin", "Dropping trash outside", "Breaking a sign", "Ignoring a mess"], answer: "Putting trash in a bin", hint: "Choose the action that keeps places clean.", explanation: "Using a bin keeps shared spaces clean."},
      {title: "Rules at home", prompt: "Why should family members follow home rules?", choices: ["To live safely together", "To make more messes", "To stop talking", "To lose things"], answer: "To live safely together", hint: "Rules help a group get along.", explanation: "Home rules help families live safely and respectfully."}
    ]
  },
  writing: {
    "Sentence Building": [
      {title: "Subject and predicate", prompt: "Which part tells who or what the sentence is about?", choices: ["the subject", "the period", "the comma", "the last word"], answer: "the subject", hint: "It names the person, place, or thing.", explanation: "The subject tells who or what the sentence is about."},
      {title: "End punctuation", prompt: "Which mark ends a telling sentence?", choices: ["a period", "a question mark", "an exclamation mark", "a comma"], answer: "a period", hint: "A statement uses a period.", explanation: "A telling sentence ends with a period."},
      {title: "Word order", prompt: "Which is a complete sentence?", choices: ["The cat sleeps.", "Sleeps the cat", "cat the", "sleeps"], answer: "The cat sleeps.", hint: "A sentence needs a subject and a verb.", explanation: "The cat sleeps has a subject and a verb."},
      {title: "Complete thought", prompt: "Which group of words is NOT a complete sentence?", choices: ["Because it rained.", "The ground is wet.", "We stayed inside.", "I read a book."], answer: "Because it rained.", hint: "A complete sentence can stand alone.", explanation: "Because it rained leaves the reader waiting for more."}
    ],
    "Paragraph Building": [
      {title: "Supporting sentences", prompt: "What should supporting sentences do?", choices: ["Explain the topic sentence", "Change the topic", "Add unrelated ideas", "End the paragraph only"], answer: "Explain the topic sentence", hint: "Details support the main idea.", explanation: "Supporting sentences give details about the topic sentence."},
      {title: "Concluding sentence", prompt: "What does a concluding sentence do?", choices: ["Wraps up the paragraph", "Starts a new topic", "Lists every word", "Asks a question only"], answer: "Wraps up the paragraph", hint: "It brings the paragraph to a close.", explanation: "A concluding sentence finishes the paragraph's idea."},
      {title: "Indent", prompt: "What does an indent show?", choices: ["Where a new paragraph starts", "Where the page ends", "Which word is longest", "How to spell a word"], answer: "Where a new paragraph starts", hint: "Look at the first line of a paragraph.", explanation: "An indent marks the start of a new paragraph."},
      {title: "Stay on topic", prompt: "Which sentence does NOT belong in a paragraph about dogs?", choices: ["My bike is blue.", "Dogs need food.", "Dogs like walks.", "Dogs can learn tricks."], answer: "My bike is blue.", hint: "Find the sentence about a different subject.", explanation: "My bike is blue is not about dogs."}
    ],
    "Narrative Writing": [
      {title: "Characters", prompt: "Who are the characters in a story?", choices: ["The people or animals in it", "The title only", "The reader's shoes", "The paper"], answer: "The people or animals in it", hint: "Characters take part in the action.", explanation: "Characters are the people or animals in a story."},
      {title: "Setting", prompt: "What is the setting of a story?", choices: ["Where and when it happens", "Who wrote it", "How long it is", "The last word"], answer: "Where and when it happens", hint: "Think about place and time.", explanation: "The setting is where and when a story takes place."},
      {title: "Problem and solution", prompt: "Which sentence states a story problem?", choices: ["Leo lost his kite.", "Leo is a boy.", "The sky is blue.", "Leo has a sister."], answer: "Leo lost his kite.", hint: "A problem needs to be solved.", explanation: "Losing a kite creates a problem to solve."},
      {title: "Temporal words", prompt: "Which word helps show the order of events?", choices: ["then", "blue", "happy", "chair"], answer: "then", hint: "Order words tell when things happen.", explanation: "Then shows that one event follows another."}
    ],
    "Informative Writing": [
      {title: "Topic and facts", prompt: "What should an informative paragraph include?", choices: ["A topic and facts", "Only an opinion", "A made-up story", "A list of names"], answer: "A topic and facts", hint: "Informative writing teaches facts.", explanation: "It states a topic and supports it with facts."},
      {title: "Definitions", prompt: "What does a definition explain?", choices: ["What a word means", "Where a story happens", "How to end a story", "Who wins a game"], answer: "What a word means", hint: "Definitions explain words.", explanation: "A definition explains the meaning of a word."},
      {title: "Compare", prompt: "Which sentence compares two animals?", choices: ["A rabbit hops, but a fish swims.", "I have a rabbit.", "Fish are interesting.", "Animals are alive."], answer: "A rabbit hops, but a fish swims.", hint: "Comparison tells how things are alike or different.", explanation: "It compares how a rabbit and a fish move."},
      {title: "Diagram labels", prompt: "What should a label on a diagram be?", choices: ["Clear and correct", "Very long", "A secret", "About something else"], answer: "Clear and correct", hint: "Labels help readers understand.", explanation: "Clear, correct labels make a diagram useful."}
    ],
    "Opinion Writing": [
      {title: "State opinion", prompt: "Which sentence states an opinion?", choices: ["Summer is the best season.", "Summer has 92 days.", "The sun rises in the east.", "Water freezes at 0°C."], answer: "Summer is the best season.", hint: "An opinion tells what someone thinks.", explanation: "Best is a judgment, so this is an opinion."},
      {title: "Give two reasons", prompt: "What makes an opinion stronger?", choices: ["Two clear reasons", "No reasons", "A change of topic", "A single word"], answer: "Two clear reasons", hint: "Reasons support what you think.", explanation: "Two clear reasons make the opinion more convincing."},
      {title: "Address the reader", prompt: "Which word directly addresses the reader?", choices: ["you", "they", "she", "it"], answer: "you", hint: "It points to the person reading.", explanation: "You speaks directly to the reader."},
      {title: "Word choice", prompt: "Which word makes an opinion sound stronger?", choices: ["amazing", "nice", "okay", "fine"], answer: "amazing", hint: "Choose the most vivid word.", explanation: "Amazing is a stronger, more vivid word than nice or okay."}
    ],
    "Revision & Editing": [
      {title: "Spelling", prompt: "Which word is spelled correctly?", choices: ["friend", "freind", "frend", "firend"], answer: "friend", hint: "Remember the i before e pattern here.", explanation: "Friend is the correct spelling."},
      {title: "Verb tense", prompt: "Which sentence uses the past tense correctly?", choices: ["We walked to school.", "We walk to school yesterday.", "We walking to school.", "We will walked to school."], answer: "We walked to school.", hint: "Yesterday needs a past-tense verb.", explanation: "Walked is the past tense of walk."},
      {title: "Combine sentences", prompt: "Which combines the sentences correctly? I like apples. I like pears.", choices: ["I like apples and pears.", "I like apples. and pears.", "I like apples, or. pears.", "I like apples I like."], answer: "I like apples and pears.", hint: "Use a joining word.", explanation: "And joins the two ideas about fruit."},
      {title: "Peer feedback", prompt: "What is helpful feedback on a friend's writing?", choices: ["Say one thing that works and one thing to improve", "Say nothing", "Copy the whole story", "Ignore the writing"], answer: "Say one thing that works and one thing to improve", hint: "Feedback should be kind and specific.", explanation: "Naming a strength and an improvement helps the writer revise."}
    ]
  }
};
