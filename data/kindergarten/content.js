/* Kindergarten curriculum content data */
    // ---------- Data ----------
    // ---------- Levels ----------
    // Per-index level icons, reused by every leveled subject.
    const LEVEL_ICONS = ['🌱','🌿','🔥','⭐','🌟','💎','🪙','🏆','👑','🌈'];

    // ---------- Letters / Numbers / Colors / Shapes (no levels) ----------
    const LETTERS = [
        {id:'A',word:'Apple',emoji:'🍎'},{id:'B',word:'Ball',emoji:'⚽'},{id:'C',word:'Cat',emoji:'🐱'},
        {id:'D',word:'Dog',emoji:'🐶'},{id:'E',word:'Elephant',emoji:'🐘'},{id:'F',word:'Fish',emoji:'🐟'},
        {id:'G',word:'Grapes',emoji:'🍇'},{id:'H',word:'Hat',emoji:'👒'},{id:'I',word:'Ice Cream',emoji:'🍦'},
        {id:'J',word:'Juice',emoji:'🧃'},{id:'K',word:'Kite',emoji:'🪁'},{id:'L',word:'Lion',emoji:'🦁'},
        {id:'M',word:'Moon',emoji:'🌙'},{id:'N',word:'Nest',emoji:'🪺'},{id:'O',word:'Orange',emoji:'🍊'},
        {id:'P',word:'Pig',emoji:'🐷'},{id:'Q',word:'Queen',emoji:'👸'},{id:'R',word:'Rainbow',emoji:'🌈'},
        {id:'S',word:'Sun',emoji:'☀️'},{id:'T',word:'Tree',emoji:'🌳'},{id:'U',word:'Umbrella',emoji:'☂️'},
        {id:'V',word:'Van',emoji:'🚐'},{id:'W',word:'Watermelon',emoji:'🍉'},{id:'X',word:'X-ray',emoji:'🩻'},
        {id:'Y',word:'Yo-yo',emoji:'🪀'},{id:'Z',word:'Zebra',emoji:'🦓'}
    ];
    const NUMBERS = Array.from({length:20}, (_,i) => ({id:String(i+1), n:i+1}));

    // ---------- Shared vocabulary (English / Chinese / Spanish) ----------
    // One source of truth per level. Add a word here and it appears in all three
    // languages automatically. To add a level, append another array to VOCAB_LEVELS.
    const VOCAB_LEVELS = [
        [ // Level 1 — original kindergarten vocabulary
            {id:'ant',emoji:'🐜',en:'Ant',zh:{hanzi:'蚂蚁'},es:'Hormiga'},
            {id:'apple',emoji:'🍎',en:'Apple',zh:{hanzi:'苹果'},es:'Manzana'},
            {id:'baby',emoji:'👶',en:'Baby',zh:{hanzi:'婴儿'},es:'Bebé'},
            {id:'ball',emoji:'⚽',en:'Ball',zh:{hanzi:'球'},es:'Pelota'},
            {id:'bear',emoji:'🐻',en:'Bear',zh:{hanzi:'熊'},es:'Oso'},
            {id:'bird',emoji:'🐦',en:'Bird',zh:{hanzi:'鸟'},es:'Pájaro'},
            {id:'book',emoji:'📖',en:'Book',zh:{hanzi:'书'},es:'Libro'},
            {id:'bus',emoji:'🚌',en:'Bus',zh:{hanzi:'公共汽车'},es:'Autobús'},
            {id:'cake',emoji:'🎂',en:'Cake',zh:{hanzi:'蛋糕'},es:'Pastel'},
            {id:'cat',emoji:'🐱',en:'Cat',zh:{hanzi:'猫'},es:'Gato'},
            {id:'dog',emoji:'🐶',en:'Dog',zh:{hanzi:'狗'},es:'Perro'},
            {id:'egg',emoji:'🥚',en:'Egg',zh:{hanzi:'鸡蛋'},es:'Huevo'},
            {id:'fish',emoji:'🐟',en:'Fish',zh:{hanzi:'鱼'},es:'Pez'},
            {id:'frog',emoji:'🐸',en:'Frog',zh:{hanzi:'青蛙'},es:'Rana'},
            {id:'hand',emoji:'✋',en:'Hand',zh:{hanzi:'手'},es:'Mano'},
            {id:'hat',emoji:'🧢',en:'Hat',zh:{hanzi:'帽子'},es:'Gorra'},
            {id:'moon',emoji:'🌙',en:'Moon',zh:{hanzi:'月亮'},es:'Luna'},
            {id:'sun',emoji:'☀️',en:'Sun',zh:{hanzi:'太阳'},es:'Sol'},
        ],
        [ // Level 2 — original kindergarten vocabulary
            {id:'banana',emoji:'🍌',en:'Banana',zh:{hanzi:'香蕉'},es:'Plátano'},
            {id:'bread',emoji:'🍞',en:'Bread',zh:{hanzi:'面包'},es:'Pan'},
            {id:'chair',emoji:'🪑',en:'Chair',zh:{hanzi:'椅子'},es:'Silla'},
            {id:'cloud',emoji:'☁️',en:'Cloud',zh:{hanzi:'云'},es:'Nube'},
            {id:'corn',emoji:'🌽',en:'Corn',zh:{hanzi:'玉米'},es:'Maíz'},
            {id:'door',emoji:'🚪',en:'Door',zh:{hanzi:'门'},es:'Puerta'},
            {id:'dress',emoji:'👗',en:'Dress',zh:{hanzi:'连衣裙'},es:'Vestido'},
            {id:'green',emoji:'🟢',en:'Green',zh:{hanzi:'绿色'},es:'Verde'},
            {id:'house',emoji:'🏠',en:'House',zh:{hanzi:'房子'},es:'Casa'},
            {id:'juice',emoji:'🧃',en:'Juice',zh:{hanzi:'果汁'},es:'Jugo'},
            {id:'lemon',emoji:'🍋',en:'Lemon',zh:{hanzi:'柠檬'},es:'Limón'},
            {id:'mouse',emoji:'🐭',en:'Mouse',zh:{hanzi:'老鼠'},es:'Ratón'},
            {id:'ocean',emoji:'🌊',en:'Ocean',zh:{hanzi:'海洋'},es:'Océano'},
            {id:'panda',emoji:'🐼',en:'Panda',zh:{hanzi:'熊猫'},es:'Panda'},
            {id:'pizza',emoji:'🍕',en:'Pizza',zh:{hanzi:'披萨'},es:'Pizza'},
            {id:'rain',emoji:'🌧️',en:'Rain',zh:{hanzi:'雨'},es:'Lluvia'},
            {id:'robot',emoji:'🤖',en:'Robot',zh:{hanzi:'机器人'},es:'Robot'},
            {id:'school',emoji:'🏫',en:'School',zh:{hanzi:'学校'},es:'Escuela'},
        ],
        [ // Level 3 — original kindergarten vocabulary
            {id:'tree',emoji:'🌳',en:'Tree',zh:{hanzi:'树'},es:'Árbol'},
            {id:'animal',emoji:'🐾',en:'Animal',zh:{hanzi:'动物'},es:'Animal'},
            {id:'basket',emoji:'🧺',en:'Basket',zh:{hanzi:'篮子'},es:'Cesta'},
            {id:'bottle',emoji:'🍼',en:'Bottle',zh:{hanzi:'瓶子'},es:'Botella'},
            {id:'button',emoji:'🔘',en:'Button',zh:{hanzi:'按钮'},es:'Botón'},
            {id:'candle',emoji:'🕯️',en:'Candle',zh:{hanzi:'蜡烛'},es:'Vela'},
            {id:'carrot',emoji:'🥕',en:'Carrot',zh:{hanzi:'胡萝卜'},es:'Zanahoria'},
            {id:'circle',emoji:'⭕',en:'Circle',zh:{hanzi:'圆形'},es:'Círculo'},
            {id:'cookie',emoji:'🍪',en:'Cookie',zh:{hanzi:'饼干'},es:'Galleta'},
            {id:'dinner',emoji:'🍽️',en:'Dinner',zh:{hanzi:'晚餐'},es:'Cena'},
            {id:'flower',emoji:'🌸',en:'Flower',zh:{hanzi:'花'},es:'Flor'},
            {id:'garden',emoji:'🌷',en:'Garden',zh:{hanzi:'花园'},es:'Jardín'},
            {id:'guitar',emoji:'🎸',en:'Guitar',zh:{hanzi:'吉他'},es:'Guitarra'},
            {id:'happy',emoji:'😊',en:'Happy',zh:{hanzi:'开心的'},es:'Feliz'},
            {id:'inside',emoji:'🏠',en:'Inside',zh:{hanzi:'里面'},es:'Dentro'},
            {id:'jacket',emoji:'🧥',en:'Jacket',zh:{hanzi:'夹克'},es:'Chaqueta'},
            {id:'kitten',emoji:'🐱',en:'Kitten',zh:{hanzi:'小猫'},es:'Gatito'},
            {id:'ladder',emoji:'🪜',en:'Ladder',zh:{hanzi:'梯子'},es:'Escalera'},
        ],
        [ // Level 4 — original kindergarten vocabulary
            {id:'little',emoji:'🤏',en:'Little',zh:{hanzi:'小的'},es:'Pequeño'},
            {id:'music',emoji:'🎵',en:'Music',zh:{hanzi:'音乐'},es:'Música'},
            {id:'airport',emoji:'✈️',en:'Airport',zh:{hanzi:'机场'},es:'Aeropuerto'},
            {id:'backpack',emoji:'🎒',en:'Backpack',zh:{hanzi:'背包'},es:'Mochila'},
            {id:'birthday',emoji:'🎈',en:'Birthday',zh:{hanzi:'生日'},es:'Cumpleaños'},
            {id:'breakfast',emoji:'🥣',en:'Breakfast',zh:{hanzi:'早餐'},es:'Desayuno'},
            {id:'building',emoji:'🏢',en:'Building',zh:{hanzi:'建筑物'},es:'Edificio'},
            {id:'butterfly',emoji:'🦋',en:'Butterfly',zh:{hanzi:'蝴蝶'},es:'Mariposa'},
            {id:'computer',emoji:'💻',en:'Computer',zh:{hanzi:'电脑'},es:'Computadora'},
            {id:'elephant',emoji:'🐘',en:'Elephant',zh:{hanzi:'大象'},es:'Elefante'},
            {id:'family',emoji:'👨‍👩‍👧',en:'Family',zh:{hanzi:'家庭'},es:'Familia'},
            {id:'football',emoji:'🏈',en:'Football',zh:{hanzi:'橄榄球'},es:'Fútbol'},
            {id:'grandma',emoji:'👵',en:'Grandma',zh:{hanzi:'奶奶'},es:'Abuela'},
            {id:'hospital',emoji:'🏥',en:'Hospital',zh:{hanzi:'医院'},es:'Hospital'},
            {id:'jellyfish',emoji:'🪼',en:'Jellyfish',zh:{hanzi:'水母'},es:'Medusa'},
            {id:'library',emoji:'📚',en:'Library',zh:{hanzi:'图书馆'},es:'Biblioteca'},
            {id:'mountain',emoji:'⛰️',en:'Mountain',zh:{hanzi:'山'},es:'Montaña'},
            {id:'rainbow',emoji:'🌈',en:'Rainbow',zh:{hanzi:'彩虹'},es:'Arcoíris'},
        ],
        [ // Level 5 — original kindergarten vocabulary
            {id:'sandwich',emoji:'🥪',en:'Sandwich',zh:{hanzi:'三明治'},es:'Sándwich'},
            {id:'teacher',emoji:'🧑‍🏫',en:'Teacher',zh:{hanzi:'老师'},es:'Maestro'},
            {id:'window',emoji:'🪟',en:'Window',zh:{hanzi:'窗户'},es:'Ventana'},
            {id:'adventure',emoji:'🧭',en:'Adventure',zh:{hanzi:'冒险'},es:'Aventura'},
            {id:'beautiful',emoji:'🌸',en:'Beautiful',zh:{hanzi:'美丽的'},es:'Hermoso'},
            {id:'careful',emoji:'👀',en:'Careful',zh:{hanzi:'小心的'},es:'Cuidadoso'},
            {id:'classroom',emoji:'🏫',en:'Classroom',zh:{hanzi:'教室'},es:'Aula'},
            {id:'dinosaur',emoji:'🦖',en:'Dinosaur',zh:{hanzi:'恐龙'},es:'Dinosaurio'},
            {id:'exercise',emoji:'🏃',en:'Exercise',zh:{hanzi:'运动'},es:'Ejercicio'},
            {id:'favorite',emoji:'❤️',en:'Favorite',zh:{hanzi:'最喜欢的'},es:'Favorito'},
            {id:'firefly',emoji:'✨',en:'Firefly',zh:{hanzi:'萤火虫'},es:'Luciérnaga'},
            {id:'friendship',emoji:'🤝',en:'Friendship',zh:{hanzi:'友谊'},es:'Amistad'},
            {id:'giraffe',emoji:'🦒',en:'Giraffe',zh:{hanzi:'长颈鹿'},es:'Jirafa'},
            {id:'important',emoji:'⭐',en:'Important',zh:{hanzi:'重要的'},es:'Importante'},
            {id:'jellybean',emoji:'🍬',en:'Jellybean',zh:{hanzi:'软糖'},es:'Gominola'},
            {id:'kangaroo',emoji:'🦘',en:'Kangaroo',zh:{hanzi:'袋鼠'},es:'Canguro'},
            {id:'playground',emoji:'🛝',en:'Playground',zh:{hanzi:'游乐场'},es:'Patio'},
            {id:'sunshine',emoji:'☀️',en:'Sunshine',zh:{hanzi:'阳光'},es:'Luz solar'},
        ],
        [ // Level 6 — original kindergarten vocabulary
            {id:'teamwork',emoji:'🤝',en:'Teamwork',zh:{hanzi:'团队合作'},es:'Trabajo en equipo'},
            {id:'wonderful',emoji:'🌟',en:'Wonderful',zh:{hanzi:'精彩的'},es:'Maravilloso'},
            {id:'zebra',emoji:'🦓',en:'Zebra',zh:{hanzi:'斑马'},es:'Cebra'},
            {id:'caterpillar',emoji:'🐛',en:'Caterpillar',zh:{hanzi:'毛毛虫'},es:'Oruga'},
            {id:'chocolate',emoji:'🍫',en:'Chocolate',zh:{hanzi:'巧克力'},es:'Chocolate'},
            {id:'community',emoji:'🏘️',en:'Community',zh:{hanzi:'社区'},es:'Comunidad'},
            {id:'discover',emoji:'🔎',en:'Discover',zh:{hanzi:'发现'},es:'Descubrir'},
            {id:'everywhere',emoji:'🌎',en:'Everywhere',zh:{hanzi:'到处'},es:'En todas partes'},
            {id:'friendly',emoji:'😊',en:'Friendly',zh:{hanzi:'友好的'},es:'Amistoso'},
            {id:'happiness',emoji:'😄',en:'Happiness',zh:{hanzi:'幸福'},es:'Felicidad'},
            {id:'imagine',emoji:'💭',en:'Imagine',zh:{hanzi:'想象'},es:'Imaginar'},
            {id:'kindness',emoji:'💗',en:'Kindness',zh:{hanzi:'善良'},es:'Amabilidad'},
            {id:'learning',emoji:'📘',en:'Learning',zh:{hanzi:'学习'},es:'Aprendizaje'},
            {id:'medicine',emoji:'💊',en:'Medicine',zh:{hanzi:'药'},es:'Medicina'},
            {id:'question',emoji:'❓',en:'Question',zh:{hanzi:'问题'},es:'Pregunta'},
            {id:'remember',emoji:'🧠',en:'Remember',zh:{hanzi:'记住'},es:'Recordar'},
            {id:'together',emoji:'🤝',en:'Together',zh:{hanzi:'一起'},es:'Juntos'},
        ],
        [ // Level 7 — original kindergarten vocabulary
            {id:'vegetable',emoji:'🥦',en:'Vegetable',zh:{hanzi:'蔬菜'},es:'Verdura'},
            {id:'yesterday',emoji:'📅',en:'Yesterday',zh:{hanzi:'昨天'},es:'Ayer'},
            {id:'yourself',emoji:'🙂',en:'Yourself',zh:{hanzi:'你自己'},es:'Tú mismo'},
            {id:'celebrate',emoji:'🎉',en:'Celebrate',zh:{hanzi:'庆祝'},es:'Celebrar'},
            {id:'conversation',emoji:'💬',en:'Conversation',zh:{hanzi:'对话'},es:'Conversación'},
            {id:'creativity',emoji:'🎨',en:'Creativity',zh:{hanzi:'创造力'},es:'Creatividad'},
            {id:'different',emoji:'🔀',en:'Different',zh:{hanzi:'不同的'},es:'Diferente'},
            {id:'education',emoji:'🎓',en:'Education',zh:{hanzi:'教育'},es:'Educación'},
            {id:'exploring',emoji:'🧭',en:'Exploring',zh:{hanzi:'探索'},es:'Explorando'},
            {id:'generous',emoji:'💝',en:'Generous',zh:{hanzi:'慷慨的'},es:'Generoso'},
            {id:'imagination',emoji:'🌈',en:'Imagination',zh:{hanzi:'想象力'},es:'Imaginación'},
            {id:'knowledge',emoji:'📚',en:'Knowledge',zh:{hanzi:'知识'},es:'Conocimiento'},
            {id:'listening',emoji:'👂',en:'Listening',zh:{hanzi:'倾听'},es:'Escuchar'},
            {id:'neighborhood',emoji:'🏘️',en:'Neighborhood',zh:{hanzi:'社区'},es:'Vecindario'},
            {id:'practice',emoji:'✏️',en:'Practice',zh:{hanzi:'练习'},es:'Práctica'},
            {id:'responsible',emoji:'✅',en:'Responsible',zh:{hanzi:'负责的'},es:'Responsable'},
            {id:'storybook',emoji:'📖',en:'Storybook',zh:{hanzi:'故事书'},es:'Libro de cuentos'},
            {id:'understanding',emoji:'💡',en:'Understanding',zh:{hanzi:'理解'},es:'Comprensión'},
        ],
        [ // Level 8 — original kindergarten vocabulary
            {id:'achievement',emoji:'🏆',en:'Achievement',zh:{hanzi:'成就'},es:'Logro'},
            {id:'communication',emoji:'💬',en:'Communication',zh:{hanzi:'交流'},es:'Comunicación'},
            {id:'cooperation',emoji:'🤝',en:'Cooperation',zh:{hanzi:'合作'},es:'Cooperación'},
            {id:'development',emoji:'🌱',en:'Development',zh:{hanzi:'发展'},es:'Desarrollo'},
            {id:'educational',emoji:'🎓',en:'Educational',zh:{hanzi:'教育的'},es:'Educativo'},
            {id:'independent',emoji:'🦋',en:'Independent',zh:{hanzi:'独立的'},es:'Independiente'},
            {id:'motivation',emoji:'⭐',en:'Motivation',zh:{hanzi:'动力'},es:'Motivación'},
            {id:'opportunity',emoji:'🚪',en:'Opportunity',zh:{hanzi:'机会'},es:'Oportunidad'},
            {id:'responsibility',emoji:'✅',en:'Responsibility',zh:{hanzi:'责任'},es:'Responsabilidad'},
            {id:'scientist',emoji:'🔬',en:'Scientist',zh:{hanzi:'科学家'},es:'Científico'},
            {id:'improvement',emoji:'📈',en:'Improvement',zh:{hanzi:'进步'},es:'Mejora'},
            {id:'investigation',emoji:'🔎',en:'Investigation',zh:{hanzi:'调查'},es:'Investigación'},
            {id:'measurement',emoji:'📏',en:'Measurement',zh:{hanzi:'测量'},es:'Medición'},
            {id:'relationship',emoji:'❤️',en:'Relationship',zh:{hanzi:'关系'},es:'Relación'},
        ],
        [ // Level 9 — original kindergarten vocabulary
            {id:'successful',emoji:'🏆',en:'Successful',zh:{hanzi:'成功的'},es:'Exitoso'},
            {id:'vocabulary',emoji:'📚',en:'Vocabulary',zh:{hanzi:'词汇'},es:'Vocabulario'},
            {id:'discovery',emoji:'🔍',en:'Discovery',zh:{hanzi:'发现'},es:'Descubrimiento'},
            {id:'explorer',emoji:'🧭',en:'Explorer',zh:{hanzi:'探险家'},es:'Explorador'},
            {id:'alphabet',emoji:'🔤',en:'Alphabet',zh:{hanzi:'字母表'},es:'Alfabeto'},
            {id:'celebration',emoji:'🎊',en:'Celebration',zh:{hanzi:'庆典'},es:'Celebración'},
            {id:'curiosity',emoji:'🔍',en:'Curiosity',zh:{hanzi:'好奇心'},es:'Curiosidad'},
            {id:'determination',emoji:'💪',en:'Determination',zh:{hanzi:'决心'},es:'Determinación'},
            {id:'environment',emoji:'🌎',en:'Environment',zh:{hanzi:'环境'},es:'Medio ambiente'},
            {id:'experiment',emoji:'🧪',en:'Experiment',zh:{hanzi:'实验'},es:'Experimento'},
            {id:'geography',emoji:'🗺️',en:'Geography',zh:{hanzi:'地理'},es:'Geografía'},
            {id:'impossible',emoji:'🚫',en:'Impossible',zh:{hanzi:'不可能的'},es:'Imposible'},
            {id:'kindergarten',emoji:'🏫',en:'Kindergarten',zh:{hanzi:'幼儿园'},es:'Jardín de infancia'},
            {id:'mathematics',emoji:'➕',en:'Mathematics',zh:{hanzi:'数学'},es:'Matemáticas'},
            {id:'observation',emoji:'👀',en:'Observation',zh:{hanzi:'观察'},es:'Observación'},
            {id:'preparation',emoji:'🎒',en:'Preparation',zh:{hanzi:'准备'},es:'Preparación'},
            {id:'recycling',emoji:'♻️',en:'Recycling',zh:{hanzi:'回收'},es:'Reciclaje'},
        ],
        [ // Level 10 — original kindergarten vocabulary
            {id:'storytelling',emoji:'📖',en:'Storytelling',zh:{hanzi:'讲故事'},es:'Narración'},
            {id:'technology',emoji:'💻',en:'Technology',zh:{hanzi:'技术'},es:'Tecnología'},
            {id:'understand',emoji:'💡',en:'Understand',zh:{hanzi:'理解'},es:'Entender'},
            {id:'wondering',emoji:'🤔',en:'Wondering',zh:{hanzi:'思考'},es:'Preguntándose'},
            {id:'youngster',emoji:'🧒',en:'Youngster',zh:{hanzi:'小朋友'},es:'Niño'},
        ],
    ];

    const WORDS_LEVELS = VOCAB_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i],
        items: entries.map(v => ({ id:v.id, emoji:v.emoji, img:v.img }))
    }));
    const CHINESE_LEVELS = VOCAB_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i],
        items: entries.map(v => ({ id:v.id, emoji:v.emoji, img:v.img, hanzi:v.zh.hanzi, en:v.en }))
    }));
    const SPANISH_LEVELS = VOCAB_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i],
        items: entries.map(v => ({ id:v.id, emoji:v.emoji, img:v.img, es:v.es, en:v.en }))
    }));

    // ---------- Math (10 levels; difficulty ramps with level + solved count) ----------
    const MATH_LEVELS = Array.from({length:10}, (_, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: []
    }));


    // ---------- Science (8 levels; emoji-based with fun facts) ----------
    const SCIENCE_LEVELS = [
        [ // Level 1 — Weather
            {id:'sun',emoji:'☀️',fact:'The sun is a star that gives us light and warmth!'},
            {id:'rain',emoji:'🌧️',fact:'Rain comes from clouds and helps plants grow!'},
            {id:'snow',emoji:'❄️',fact:'Snow is frozen water that falls from clouds!'},
            {id:'wind',emoji:'💨',fact:'Wind is air moving from one place to another!'},
            {id:'cloud',emoji:'☁️',fact:'Clouds are made of tiny water droplets floating in the sky!'},
            {id:'rainbow',emoji:'🌈',fact:'Rainbows appear when sunlight shines through rain!'},
            {id:'thunder',emoji:'⛈️',fact:'Thunder is the loud sound made by lightning!'},
            {id:'ice',emoji:'🧊',fact:'Ice is water that has frozen solid!'},
        ],
        [ // Level 2 — Space
            {id:'moon',emoji:'🌙',fact:'The moon goes around the Earth and lights up the night!'},
            {id:'star',emoji:'⭐',fact:'Stars are giant balls of hot gas that make their own light!'},
            {id:'earth',emoji:'🌍',fact:'Earth is our planet — it has land, water, and air!'},
            {id:'planet',emoji:'🪐',fact:'Planets are big objects that orbit around a star!'},
            {id:'comet',emoji:'☄️',fact:'Comets are icy balls that fly through space with a glowing tail!'},
            {id:'galaxy',emoji:'🌌',fact:'A galaxy is a huge group of stars — we live in the Milky Way!'},
            {id:'rocket',emoji:'🚀',fact:'Rockets fly into space to explore the stars and planets!'},
            {id:'satellite',emoji:'🛰️',fact:'Satellites orbit Earth and help us talk and navigate!'},
        ],
        [ // Level 3 — Plants
            {id:'flower',emoji:'🌸',fact:'Flowers are the colorful parts of a plant that make seeds!'},
            {id:'tree',emoji:'🌳',fact:'Trees are the biggest plants — they give us oxygen!'},
            {id:'seed',emoji:'🌱',fact:'A seed is a tiny baby plant waiting to grow!'},
            {id:'leaf',emoji:'🍃',fact:'Leaves use sunlight to make food for the plant!'},
            {id:'root',emoji:'🪴',fact:'Roots hold the plant in the ground and drink water!'},
            {id:'grass',emoji:'🌿',fact:'Grass is a plant that covers the ground and is soft to touch!'},
            {id:'mushroom',emoji:'🍄',fact:'Mushrooms are fungi — they are not plants or animals!'},
            {id:'cactus',emoji:'🌵',fact:'Cacti store water inside their stems so they can live in the desert!'},
        ],
        [ // Level 4 — Body Parts
            {id:'eye',emoji:'👁️',fact:'Eyes help you see — they can detect millions of colors!'},
            {id:'ear',emoji:'👂',fact:'Ears help you hear sounds and keep your balance!'},
            {id:'nose',emoji:'👃',fact:'Your nose helps you smell and also helps you breathe!'},
            {id:'hand',emoji:'✋',fact:'Hands have 5 fingers and can pick up and hold things!'},
            {id:'foot',emoji:'🦶',fact:'Feet help you walk, run, and jump!'},
            {id:'heart',emoji:'❤️',fact:'Your heart pumps blood through your whole body!'},
            {id:'tooth',emoji:'🦷',fact:'Teeth help you bite and chew your food!'},
            {id:'bone',emoji:'🦴',fact:'Bones are hard parts inside your body that give you shape!'},
        ],
        [ // Level 5 — Animals
            {id:'frog',emoji:'🐸',fact:'Frogs can jump really far and live both in water and on land!'},
            {id:'snake',emoji:'🐍',fact:'Snakes slither on the ground and have no legs!'},
            {id:'whale',emoji:'🐋',fact:'Whales are the biggest animals on Earth — they live in the ocean!'},
            {id:'eagle',emoji:'🦅',fact:'Eagles are birds that can see very far from high in the sky!'},
            {id:'fish',emoji:'🐟',fact:'Fish breathe underwater using gills instead of lungs!'},
            {id:'ant',emoji:'🐜',fact:'Ants are tiny but very strong — they can carry 50 times their weight!'},
            {id:'bee',emoji:'🐝',fact:'Bees make honey and help flowers grow by spreading pollen!'},
            {id:'owl',emoji:'🦉',fact:'Owls can see in the dark and turn their heads almost all the way around!'},
        ],
        [ // Level 6 — Seasons & Earth
            {id:'spring',emoji:'🌷',fact:'Spring is when flowers bloom and baby animals are born!'},
            {id:'summer',emoji:'☀️',fact:'Summer is the hottest season — great for swimming!'},
            {id:'autumn',emoji:'🍂',fact:'In autumn, leaves change color and fall from trees!'},
            {id:'winter',emoji:'⛄',fact:'Winter is the coldest season — sometimes it snows!'},
            {id:'ocean',emoji:'🌊',fact:'Oceans cover most of Earth and are home to amazing sea creatures!'},
            {id:'river',emoji:'🏞️',fact:'Rivers flow from mountains to the sea and bring fresh water!'},
            {id:'mountain',emoji:'⛰️',fact:'Mountains are the tallest land on Earth — some touch the clouds!'},
            {id:'volcano',emoji:'🌋',fact:'Volcanoes are mountains that can erupt with hot lava!'},
        ],
        [ // Level 7 — Sounds & States
            {id:'hot',emoji:'🔥',fact:'Hot things have lots of energy — like fire and the sun!'},
            {id:'cold',emoji:'🥶',fact:'Cold things have less energy — like ice and snow!'},
            {id:'wet',emoji:'💧',fact:'Wet means water is on something — like after rain!'},
            {id:'dry',emoji:'🏜️',fact:'Dry means no water — like a desert or sunny day!'},
            {id:'loud',emoji:'📢',fact:'Loud sounds have lots of energy — like thunder or a drum!'},
            {id:'quiet',emoji:'🤫',fact:'Quiet means very soft or no sound at all!'},
            {id:'soft',emoji:'🧸',fact:'Soft things are easy to squeeze — like a pillow or cotton!'},
            {id:'hard',emoji:'🪨',fact:'Hard things are strong and tough to break — like a rock!'},
        ],
        [ // Level 8 — Shapes & Colors
            {id:'circle',emoji:'⭕',fact:'A circle is round with no corners — like a ball!'},
            {id:'square',emoji:'🟧',fact:'A square has 4 equal sides and 4 corners!'},
            {id:'triangle',emoji:'🔺',fact:'A triangle has 3 sides and 3 corners!'},
            {id:'rectangle',emoji:'🧱',fact:'A rectangle has 4 sides — 2 long and 2 short!'},
            {id:'red',emoji:'🔴',fact:'Red is the color of apples, fire trucks, and hearts!'},
            {id:'blue',emoji:'🔵',fact:'Blue is the color of the sky and the ocean!'},
            {id:'yellow',emoji:'🟡',fact:'Yellow is the color of the sun and bananas!'},
            {id:'green',emoji:'🟢',fact:'Green is the color of grass, leaves, and frogs!'},
        ],
        [ // Level 9 — Magnets
            {id:'magnet_paperclip',emoji:'📎',fact:'Magnets can pull metal objects like paper clips!',answer:'Can pull',options:['Can pull','Cannot pull']},
            {id:'magnet_rubber',emoji:'🦆',fact:'Magnets cannot pull rubber — rubber is not magnetic!',answer:'Cannot pull',options:['Can pull','Cannot pull']},
            {id:'magnet_spoon',emoji:'🥄',fact:'Spoons are made of metal, so magnets can pull them!',answer:'Can pull',options:['Can pull','Cannot pull']},
            {id:'magnet_wood',emoji:'🪵',fact:'Wood is not magnetic — magnets cannot pull it!',answer:'Cannot pull',options:['Can pull','Cannot pull']},
            {id:'magnet_nail',emoji:'🔩',fact:'Nails are made of metal — magnets love them!',answer:'Can pull',options:['Can pull','Cannot pull']},
            {id:'magnet_eraser',emoji:'✏️',fact:'Erasers are rubber — magnets cannot pull them!',answer:'Cannot pull',options:['Can pull','Cannot pull']},
            {id:'magnet_coin',emoji:'🪙',fact:'Coins are made of metal — some magnets can pull them!',answer:'Can pull',options:['Can pull','Cannot pull']},
            {id:'magnet_fabric',emoji:'🧶',fact:'Fabric is cloth — magnets cannot pull it!',answer:'Cannot pull',options:['Can pull','Cannot pull']},
        ],
        [ // Level 10 — Push and Pull
            {id:'push_door',emoji:'🚪',fact:'Opening a door is a push — you push it forward!',answer:'Push',options:['Push','Pull']},
            {id:'pull_drawer',emoji:'🗄️',fact:'Opening a drawer is a pull — you pull it toward you!',answer:'Pull',options:['Push','Pull']},
            {id:'push_ball',emoji:'⚽',fact:'Kicking a ball is a push — you push it with your foot!',answer:'Push',options:['Push','Pull']},
            {id:'pull_cart',emoji:'🛒',fact:'Pulling a cart is a pull — you drag it behind you!',answer:'Pull',options:['Push','Pull']},
            {id:'push_swing',emoji:'🪁',fact:'Pushing a swing is a push — you push it away!',answer:'Push',options:['Push','Pull']},
            {id:'pull_rope',emoji:'🪢',fact:'Tugging a rope is a pull — you pull it toward you!',answer:'Pull',options:['Push','Pull']},
            {id:'push_button',emoji:'🔘',fact:'Pressing a button is a push — you push it down!',answer:'Push',options:['Push','Pull']},
            {id:'pull_zipper',emoji:'🧥',fact:'Zipping a jacket is a pull — you pull the zipper up!',answer:'Pull',options:['Push','Pull']},
        ],
        [ // Level 11 — Materials (Solid, Liquid, Gas)
            {id:'rock_solid',emoji:'🪨',fact:'A rock is a solid — it keeps its shape!',answer:'Solid',options:['Solid','Liquid','Gas']},
            {id:'water_liquid',emoji:'💧',fact:'Water is a liquid — it flows and takes the shape of its container!',answer:'Liquid',options:['Solid','Liquid','Gas']},
            {id:'air_gas',emoji:'💨',fact:'Air is a gas — it fills up any space around you!',answer:'Gas',options:['Solid','Liquid','Gas']},
            {id:'ice_solid',emoji:'🧊',fact:'Ice is a solid — it is frozen water that keeps its shape!',answer:'Solid',options:['Solid','Liquid','Gas']},
            {id:'juice_liquid',emoji:'🧃',fact:'Juice is a liquid — it pours and fills a cup!',answer:'Liquid',options:['Solid','Liquid','Gas']},
            {id:'steam_gas',emoji:'♨️',fact:'Steam is a gas — it is water that got really hot!',answer:'Gas',options:['Solid','Liquid','Gas']},
            {id:'sand_solid',emoji:'🏖️',fact:'Sand is solid — tiny solid pieces that flow like a liquid!',answer:'Solid',options:['Solid','Liquid','Gas']},
            {id:'milk_liquid',emoji:'🥛',fact:'Milk is a liquid — it pours and flows!',answer:'Liquid',options:['Solid','Liquid','Gas']},
        ],
        [ // Level 12 — Survival (What does this need?)
            {id:'fish_water',emoji:'🐟',fact:'Fish need water to live — they breathe underwater!',answer:'Water',options:['Water','Sunlight','Air','Food']},
            {id:'plant_sun',emoji:'🌱',fact:'Plants need sunlight to make food through photosynthesis!',answer:'Sunlight',options:['Water','Sunlight','Air','Food']},
            {id:'bird_air',emoji:'🐦',fact:'Birds need air to breathe and fly through the sky!',answer:'Air',options:['Water','Sunlight','Air','Food']},
            {id:'bear_food',emoji:'🐻',fact:'Bears need food to have energy — they eat fish, berries, and more!',answer:'Food',options:['Water','Sunlight','Air','Food']},
            {id:'tree_water',emoji:'🌳',fact:'Trees need water from the ground to grow tall!',answer:'Water',options:['Water','Sunlight','Air','Food']},
            {id:'flower_sun',emoji:'🌸',fact:'Flowers need sunlight to bloom and make colorful petals!',answer:'Sunlight',options:['Water','Sunlight','Air','Food']},
            {id:'fish_air',emoji:'🐠',fact:'Even fish need dissolved air (oxygen) from the water!',answer:'Air',options:['Water','Sunlight','Air','Food']},
            {id:'baby_food',emoji:'👶',fact:'Babies need food like milk to grow big and strong!',answer:'Food',options:['Water','Sunlight','Air','Food']},
        ],
    ];

    const SCIENCE_LEVELS_MAPPED = SCIENCE_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i],
        items: entries.map(v => ({ id:v.id, emoji:v.emoji, fact:v.fact, img:'images/science/' + v.id + '.webp' }))
    }));


    // ---------- Patterns (5 levels) ----------
    const PATTERNS_LEVELS = [
        [ // Level 1 — ABAB patterns
            {id:'p1',sequence:['🔴','🔵','🔴','🔵'],answer:'🔴',options:['🔴','🔵','🟢','🟡']},
            {id:'p2',sequence:['⭐','🌙','⭐','🌙'],answer:'⭐',options:['⭐','🌙','☀️','🌈']},
            {id:'p3',sequence:['🍎','🍊','🍎','🍊'],answer:'🍎',options:['🍎','🍊','🍋','🍇']},
            {id:'p4',sequence:['🐱','🐶','🐱','🐶'],answer:'🐱',options:['🐱','🐶','🐰','🦊']},
            {id:'p5',sequence:['⬛','⬜','⬛','⬜'],answer:'⬛',options:['⬛','⬜','🟫','🟩']},
            {id:'p6',sequence:['🌸','🌿','🌸','🌿'],answer:'🌸',options:['🌸','🌿','🍂','❄️']},
            {id:'p7',sequence:['🟥','🟦','🟥','🟦'],answer:'🟥',options:['🟥','🟦','🟨','🟩']},
            {id:'p8',sequence:['🔶','🔷','🔶','🔷'],answer:'🔶',options:['🔶','🔷','🔺','🔻']},
        ],
        [ // Level 2 — AABB patterns
            {id:'p9',sequence:['🔴','🔴','🔵','🔵'],answer:'🔴',options:['🔴','🔵','🟢','🟡']},
            {id:'p10',sequence:['⭐','⭐','🌙','🌙'],answer:'⭐',options:['⭐','🌙','☀️','🌈']},
            {id:'p11',sequence:['🍎','🍎','🍊','🍊'],answer:'🍎',options:['🍎','🍊','🍋','🍇']},
            {id:'p12',sequence:['🐱','🐱','🐶','🐶'],answer:'🐱',options:['🐱','🐶','🐰','🦊']},
            {id:'p13',sequence:['🟩','🟩','🟪','🟪'],answer:'🟩',options:['🟩','🟪','🟧','🟥']},
            {id:'p14',sequence:['🪨','🪨','🪵','🪵'],answer:'🪨',options:['🪨','🪵','🧱','💎']},
            {id:'p15',sequence:['🎵','🎵','🎶','🎶'],answer:'🎵',options:['🎵','🎶','🎤','🎸']},
            {id:'p16',sequence:['🦁','🦁','🐯','🐯'],answer:'🦁',options:['🦁','🐯','🐻','🐸']},
        ],
        [ // Level 3 — ABC patterns
            {id:'p17',sequence:['🔴','🔵','🟢','🔴','🔵'],answer:'🟢',options:['🔴','🔵','🟢','🟡']},
            {id:'p18',sequence:['⭐','🌙','☀️','⭐','🌙'],answer:'☀️',options:['⭐','🌙','☀️','🌈']},
            {id:'p19',sequence:['🍎','🍊','🍋','🍎','🍊'],answer:'🍋',options:['🍎','🍊','🍋','🍇']},
            {id:'p20',sequence:['🐱','🐶','🐰','🐱','🐶'],answer:'🐰',options:['🐱','🐶','🐰','🦊']},
            {id:'p21',sequence:['🟥','🟦','🟨','🟥','🟦'],answer:'🟨',options:['🟥','🟦','🟨','🟩']},
            {id:'p22',sequence:['🌲','🌳','🌴','🌲','🌳'],answer:'🌴',options:['🌲','🌳','🌴','🌵']},
            {id:'p23',sequence:['❄️','🌧️','☀️','❄️','🌧️'],answer:'☀️',options:['❄️','🌧️','☀️','🌈']},
            {id:'p24',sequence:['1️⃣','2️⃣','3️⃣','1️⃣','2️⃣'],answer:'3️⃣',options:['1️⃣','2️⃣','3️⃣','4️⃣']},
        ],
        [ // Level 4 — AAB patterns
            {id:'p25',sequence:['🔴','🔴','🔵','🔴','🔴'],answer:'🔵',options:['🔴','🔵','🟢','🟡']},
            {id:'p26',sequence:['⭐','⭐','🌙','⭐','⭐'],answer:'🌙',options:['⭐','🌙','☀️','🌈']},
            {id:'p27',sequence:['🍎','🍎','🍊','🍎','🍎'],answer:'🍊',options:['🍎','🍊','🍋','🍇']},
            {id:'p28',sequence:['🐱','🐱','🐶','🐱','🐱'],answer:'🐶',options:['🐱','🐶','🐰','🦊']},
            {id:'p29',sequence:['🟩','🟩','🟪','🟩','🟩'],answer:'🟪',options:['🟩','🟪','🟧','🟥']},
            {id:'p30',sequence:['🪨','🪨','💎','🪨','🪨'],answer:'💎',options:['🪨','💎','🪵','🧱']},
            {id:'p31',sequence:['🎵','🎵','🎶','🎵','🎵'],answer:'🎶',options:['🎵','🎶','🎤','🎸']},
            {id:'p32',sequence:['🌲','🌲','🌴','🌲','🌲'],answer:'🌴',options:['🌲','🌴','🌳','🌵']},
        ],
        [ // Level 5 — Growing patterns
            {id:'p33',sequence:['1️⃣','1️⃣','2️⃣','1️⃣','2️⃣','3️⃣','1️⃣','2️⃣','3️⃣'],answer:'4️⃣',options:['3️⃣','4️⃣','5️⃣','6️⃣']},
            {id:'p34',sequence:['🔴','🔴🔴','🔴🔴🔴'],answer:'🔴🔴🔴🔴',options:['🔴🔴🔴','🔴🔴🔴🔴','🔴🔴🔴🔴🔴','🔵']},
            {id:'p35',sequence:['⭐','⭐⭐','⭐⭐⭐'],answer:'⭐⭐⭐⭐',options:['⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐','🌙']},
            {id:'p36',sequence:['🍎','🍎🍎','🍎🍎🍎'],answer:'🍎🍎🍎🍎',options:['🍎🍎🍎','🍎🍎🍎🍎','🍎🍎🍎🍎🍎','🍊']},
            {id:'p37',sequence:['1️⃣','2️⃣','3️⃣'],answer:'4️⃣',options:['3️⃣','4️⃣','5️⃣','6️⃣']},
            {id:'p38',sequence:['🔵','🔵🔵','🔵🔵🔵'],answer:'🔵🔵🔵🔵',options:['🔵🔵🔵','🔵🔵🔵🔵','🔵🔵🔵🔵🔵','🔴']},
            {id:'p39',sequence:['🌱','🌿','🌳'],answer:'🏔️',options:['🌳','🌲','🏔️','🌍']},
            {id:'p40',sequence:['1️⃣','1️⃣','2️⃣','3️⃣','5️⃣'],answer:'8️⃣',options:['6️⃣','7️⃣','8️⃣','9️⃣']},
        ],
    ];

    // ---------- Comparing (3 levels) ----------
    const COMPARING_LEVELS = [
        [ // Level 1 — Compare up to 5
            {id:'c1',num1:1,num2:3,answer:'<',emoji1:'🍎',emoji2:'🍊'},
            {id:'c2',num1:5,num2:2,answer:'>',emoji1:'⭐',emoji2:'🌙'},
            {id:'c3',num1:4,num2:4,answer:'=',emoji1:'🐱',emoji2:'🐶'},
            {id:'c4',num1:2,num2:5,answer:'<',emoji1:'🧱',emoji2:'💎'},
            {id:'c5',num1:3,num2:1,answer:'>',emoji1:'🌸',emoji2:'🌿'},
            {id:'c6',num1:1,num2:1,answer:'=',emoji1:'🔴',emoji2:'🔵'},
            {id:'c7',num1:4,num2:2,answer:'>',emoji1:'🐟',emoji2:'🐸'},
            {id:'c8',num1:2,num2:4,answer:'<',emoji1:'🍎',emoji2:'🍎'},
            {id:'c9',num1:5,num2:3,answer:'>',emoji1:'⭐',emoji2:'⭐'},
            {id:'c10',num1:3,num2:5,answer:'<',emoji1:'🌙',emoji2:'🌙'},
            {id:'c11',num1:2,num2:2,answer:'=',emoji1:'🦁',emoji2:'🐯'},
            {id:'c12',num1:1,num2:4,answer:'<',emoji1:'🪨',emoji2:'💎'},
        ],
        [ // Level 2 — Compare up to 10
            {id:'c13',num1:7,num2:3,answer:'>',emoji1:'🍎',emoji2:'🍊'},
            {id:'c14',num1:4,num2:9,answer:'<',emoji1:'⭐',emoji2:'🌙'},
            {id:'c15',num1:6,num2:6,answer:'=',emoji1:'🐱',emoji2:'🐶'},
            {id:'c16',num1:8,num2:5,answer:'>',emoji1:'🧱',emoji2:'💎'},
            {id:'c17',num1:2,num2:10,answer:'<',emoji1:'🌸',emoji2:'🌿'},
            {id:'c18',num1:9,num2:9,answer:'=',emoji1:'🔴',emoji2:'🔵'},
            {id:'c19',num1:3,num2:8,answer:'<',emoji1:'🐟',emoji2:'🐸'},
            {id:'c20',num1:10,num2:6,answer:'>',emoji1:'🦁',emoji2:'🐯'},
            {id:'c21',num1:5,num2:7,answer:'<',emoji1:'🪨',emoji2:'💎'},
            {id:'c22',num1:8,num2:4,answer:'>',emoji1:'⭐',emoji2:'🌙'},
            {id:'c23',num1:7,num2:7,answer:'=',emoji1:'🍎',emoji2:'🍎'},
            {id:'c24',num1:1,num2:9,answer:'<',emoji1:'🌸',emoji2:'🌿'},
        ],
        [ // Level 3 — Compare up to 20
            {id:'c25',num1:15,num2:8,answer:'>',emoji1:'🍎',emoji2:'🍊'},
            {id:'c26',num1:6,num2:18,answer:'<',emoji1:'⭐',emoji2:'🌙'},
            {id:'c27',num1:12,num2:12,answer:'=',emoji1:'🐱',emoji2:'🐶'},
            {id:'c28',num1:20,num2:14,answer:'>',emoji1:'🧱',emoji2:'💎'},
            {id:'c29',num1:9,num2:17,answer:'<',emoji1:'🌸',emoji2:'🌿'},
            {id:'c30',num1:16,num2:16,answer:'=',emoji1:'🔴',emoji2:'🔵'},
            {id:'c31',num1:5,num2:19,answer:'<',emoji1:'🐟',emoji2:'🐸'},
            {id:'c32',num1:11,num2:7,answer:'>',emoji1:'🦁',emoji2:'🐯'},
            {id:'c33',num1:13,num2:20,answer:'<',emoji1:'🪨',emoji2:'💎'},
            {id:'c34',num1:18,num2:10,answer:'>',emoji1:'⭐',emoji2:'🌙'},
            {id:'c35',num1:14,num2:14,answer:'=',emoji1:'🍎',emoji2:'🍎'},
            {id:'c36',num1:3,num2:16,answer:'<',emoji1:'🌸',emoji2:'🌿'},
        ],
    ];

    // ---------- Positions (2 levels) ----------
    const POSITIONS_LEVELS = [
        [ // Level 1 — above/below, inside/outside, on/under
            {id:'pos1',emoji1:'🐱',emoji2:'📦',scene:'📦🐱',answer:'on',scenario:'The cat is ON the box'},
            {id:'pos2',emoji1:'🐱',emoji2:'📦',scene:'📦⬇️🐱',answer:'under',scenario:'The cat is UNDER the box'},
            {id:'pos3',emoji1:'🐠',emoji2:'🏠',scene:'🏠✅🐠',answer:'inside',scenario:'The fish is INSIDE the house'},
            {id:'pos4',emoji1:'🐰',emoji2:'🏠',scene:'🏠🚫🐰',answer:'outside',scenario:'The rabbit is OUTSIDE the house'},
            {id:'pos5',emoji1:'⭐',emoji2:'☁️',scene:'☁️⬆️⭐',answer:'above',scenario:'The star is ABOVE the cloud'},
            {id:'pos6',emoji1:'🌧️',emoji2:'☁️',scene:'☁️⬇️🌧️',answer:'below',scenario:'The rain is BELOW the cloud'},
            {id:'pos7',emoji1:'🐸',emoji2:'🪷',scene:'🪷➕🐸',answer:'on',scenario:'The frog is ON the lily pad'},
            {id:'pos8',emoji1:'🐛',emoji2:'🍎',scene:'🍎✅🐛',answer:'inside',scenario:'The worm is INSIDE the apple'},
            {id:'pos9',emoji1:'🐦',emoji2:'🌳',scene:'🌳⬆️🐦',answer:'above',scenario:'The bird is ABOVE the tree'},
            {id:'pos10',emoji1:'🪨',emoji2:'🏔️',scene:'🏔️⬇️🪨',answer:'below',scenario:'The rock is BELOW the mountain'},
            {id:'pos11',emoji1:'🐟',emoji2:'🌊',scene:'🌊➕🐟',answer:'inside',scenario:'The fish is INSIDE the water'},
            {id:'pos12',emoji1:'☀️',emoji2:'🌧️',scene:'☀️⬆️🌧️',answer:'above',scenario:'The sun is ABOVE the rain'},
        ],
        [ // Level 2 — left/right, in front/behind, between
            {id:'pos13',emoji1:'🚗',emoji2:'🏠',emoji3:'🌳',scene:'🚗🏠🌳',answer:'between',scenario:'The house is BETWEEN the car and tree'},
            {id:'pos14',emoji1:'🧑',emoji2:'🚪',scene:'🧑➡️🚪',answer:'left',scenario:'The person is to the LEFT of the door'},
            {id:'pos15',emoji1:'🧑',emoji2:'🚪',scene:'🚪➡️🧑',answer:'right',scenario:'The person is to the RIGHT of the door'},
            {id:'pos16',emoji1:'🧑',emoji2:'🚪',scene:'🧑🔵🚪',answer:'in front',scenario:'The person is IN FRONT of the door'},
            {id:'pos17',emoji1:'🧑',emoji2:'🚪',scene:'🚪🔵🧑',answer:'behind',scenario:'The person is BEHIND the door'},
            {id:'pos18',emoji1:'🐱',emoji2:'🐶',emoji3:'🐰',scene:'🐱🐶🐰',answer:'between',scenario:'The dog is BETWEEN the cat and rabbit'},
            {id:'pos19',emoji1:'🍎',emoji2:'🧃',scene:'🍎➡️🧃',answer:'left',scenario:'The apple is to the LEFT of the juice'},
            {id:'pos20',emoji1:'🍎',emoji2:'🧃',scene:'🧃➡️🍎',answer:'right',scenario:'The apple is to the RIGHT of the juice'},
            {id:'pos21',emoji1:'🏠',emoji2:'🧑',scene:'🧑🔵🏠',answer:'in front',scenario:'The person is IN FRONT of the house'},
            {id:'pos22',emoji1:'🏠',emoji2:'🧑',scene:'🏠🔵🧑',answer:'behind',scenario:'The person is BEHIND the house'},
            {id:'pos23',emoji1:'⚽',emoji2:'🏀',emoji3:'🏈',scene:'⚽🏀🏈',answer:'between',scenario:'The basketball is BETWEEN the soccer ball and football'},
            {id:'pos24',emoji1:'🌟',emoji2:'⭐',scene:'🌟➡️⭐',answer:'left',scenario:'The glowing star is to the LEFT of the star'},
        ],
    ];

    // ---------- Measurement (3 levels) ----------
    const MEASUREMENT_LEVELS = [
        [ // Level 1 — long/short
            {id:'m1',item1:{emoji:'📏',label:'pencil'},item2:{emoji:'✏️',label:'crayon'},question:'Which is longer?',answer:'pencil'},
            {id:'m2',item1:{emoji:'🐍',label:'snake'},item2:{emoji:'🐛',label:'worm'},question:'Which is longer?',answer:'snake'},
            {id:'m3',item1:{emoji:'🚂',label:'train'},item2:{emoji:'🚗',label:'car'},question:'Which is longer?',answer:'train'},
            {id:'m4',item1:{emoji:'🪢',label:'rope'},item2:{emoji:'🧶',label:'yarn'},question:'Which is shorter?',answer:'yarn'},
            {id:'m5',item1:{emoji:'🐊',label:'crocodile'},item2:{emoji:'🐸',label:'frog'},question:'Which is longer?',answer:'crocodile'},
            {id:'m6',item1:{emoji:'🛤️',label:'track'},item2:{emoji:'👟',label:'shoe'},question:'Which is longer?',answer:'track'},
            {id:'m7',item1:{emoji:'🪱',label:'earthworm'},item2:{emoji:'🐛',label:'caterpillar'},question:'Which is shorter?',answer:'caterpillar'},
            {id:'m8',item1:{emoji:'🚲',label:'bike'},item2:{emoji:'🚌',label:'bus'},question:'Which is shorter?',answer:'bike'},
        ],
        [ // Level 2 — heavy/light
            {id:'m9',item1:{emoji:'🐘',label:'elephant'},item2:{emoji:'🐱',label:'cat'},question:'Which is heavier?',answer:'elephant'},
            {id:'m10',item1:{emoji:'🪶',label:'feather'},item2:{emoji:'🪨',label:'rock'},question:'Which is lighter?',answer:'feather'},
            {id:'m11',item1:{emoji:'🧱',label:'brick'},item2:{emoji:'📄',label:'paper'},question:'Which is heavier?',answer:'brick'},
            {id:'m12',item1:{emoji:'🦛',label:'hippo'},item2:{emoji:'🐰',label:'bunny'},question:'Which is heavier?',answer:'hippo'},
            {id:'m13',item1:{emoji:'🎈',label:'balloon'},item2:{emoji:'⚽',label:'ball'},question:'Which is lighter?',answer:'balloon'},
            {id:'m14',item1:{emoji:'📚',label:'books'},item2:{emoji:'📰',label:'newspaper'},question:'Which is heavier?',answer:'books'},
            {id:'m15',item1:{emoji:'🪶',label:'feather'},item2:{emoji:'⚖️',label:'weight'},question:'Which is lighter?',answer:'feather'},
            {id:'m16',item1:{emoji:'🪨',label:'boulder'},item2:{emoji:'🏓',label:'ping pong'},question:'Which is heavier?',answer:'boulder'},
        ],
        [ // Level 3 — tall/short, big/small
            {id:'m17',item1:{emoji:'🦒',label:'giraffe'},item2:{emoji:'🐱',label:'cat'},question:'Which is taller?',answer:'giraffe'},
            {id:'m18',item1:{emoji:'🌳',label:'tree'},item2:{emoji:'🌱',label:'sprout'},question:'Which is taller?',answer:'tree'},
            {id:'m19',item1:{emoji:'🏔️',label:'mountain'},item2:{emoji:'🐜',label:'ant'},question:'Which is bigger?',answer:'mountain'},
            {id:'m20',item1:{emoji:'🐘',label:'elephant'},item2:{emoji:'🐁',label:'mouse'},question:'Which is bigger?',answer:'elephant'},
            {id:'m21',item1:{emoji:'🧍',label:'adult'},item2:{emoji:'👶',label:'baby'},question:'Which is taller?',answer:'adult'},
            {id:'m22',item1:{emoji:'🏠',label:'house'},item2:{emoji:'⛺',label:'tent'},question:'Which is bigger?',answer:'house'},
            {id:'m23',item1:{emoji:'🌻',label:'sunflower'},item2:{emoji:'🌼',label:'daisy'},question:'Which is taller?',answer:'sunflower'},
            {id:'m24',item1:{emoji:'🐋',label:'whale'},item2:{emoji:'🐟',label:'fish'},question:'Which is bigger?',answer:'whale'},
        ],
    ];

    // ---------- Time (3 levels) ----------
    const TIME_LEVELS = [
        [ // Level 1 — o'clock times
            {id:'t1',time:'1:00',emoji:'🕐',answer:'1:00',distractors:['2:00','3:00','4:00']},
            {id:'t2',time:'2:00',emoji:'🕑',answer:'2:00',distractors:['1:00','3:00','5:00']},
            {id:'t3',time:'3:00',emoji:'🕒',answer:'3:00',distractors:['1:00','2:00','6:00']},
            {id:'t4',time:'4:00',emoji:'🕓',answer:'4:00',distractors:['2:00','5:00','6:00']},
            {id:'t5',time:'5:00',emoji:'🕔',answer:'5:00',distractors:['3:00','4:00','7:00']},
            {id:'t6',time:'6:00',emoji:'🕕',answer:'6:00',distractors:['4:00','5:00','8:00']},
            {id:'t7',time:'7:00',emoji:'🕖',answer:'7:00',distractors:['5:00','6:00','9:00']},
            {id:'t8',time:'8:00',emoji:'🕗',answer:'8:00',distractors:['6:00','7:00','10:00']},
            {id:'t9',time:'9:00',emoji:'🕘',answer:'9:00',distractors:['7:00','8:00','11:00']},
            {id:'t10',time:'10:00',emoji:'🕙',answer:'10:00',distractors:['8:00','9:00','11:00']},
            {id:'t11',time:'11:00',emoji:'🕚',answer:'11:00',distractors:['9:00','10:00','12:00']},
            {id:'t12',time:'12:00',emoji:'🕛',answer:'12:00',distractors:['10:00','11:00','1:00']},
        ],
        [ // Level 2 — half-hour
            {id:'t13',time:'1:30',emoji:'🕜',answer:'1:30',distractors:['2:30','1:00','3:30']},
            {id:'t14',time:'2:30',emoji:'🕝',answer:'2:30',distractors:['1:30','3:30','2:00']},
            {id:'t15',time:'3:30',emoji:'🕞',answer:'3:30',distractors:['2:30','4:30','3:00']},
            {id:'t16',time:'4:30',emoji:'🕟',answer:'4:30',distractors:['3:30','5:30','4:00']},
            {id:'t17',time:'5:30',emoji:'🕠',answer:'5:30',distractors:['4:30','6:30','5:00']},
            {id:'t18',time:'6:30',emoji:'🕡',answer:'6:30',distractors:['5:30','7:30','6:00']},
            {id:'t19',time:'7:30',emoji:'🕢',answer:'7:30',distractors:['6:30','8:30','7:00']},
            {id:'t20',time:'8:30',emoji:'🕣',answer:'8:30',distractors:['7:30','9:30','8:00']},
            {id:'t21',time:'9:30',emoji:'🕤',answer:'9:30',distractors:['8:30','10:30','9:00']},
            {id:'t22',time:'10:30',emoji:'🕥',answer:'10:30',distractors:['9:30','11:30','10:00']},
            {id:'t23',time:'11:30',emoji:'🕦',answer:'11:30',distractors:['10:30','12:30','11:00']},
            {id:'t24',time:'12:30',emoji:'🕧',answer:'12:30',distractors:['11:30','1:30','12:00']},
        ],
        [ // Level 3 — daily schedule
            {id:'t25',time:'morning',emoji:'🌅',activity:'Eating breakfast 🥣',answer:'morning',distractors:['afternoon','evening','night']},
            {id:'t26',time:'afternoon',emoji:'☀️',activity:'Going to school 🏫',answer:'afternoon',distractors:['morning','evening','night']},
            {id:'t27',time:'night',emoji:'🌙',activity:'Going to sleep 😴',answer:'night',distractors:['morning','afternoon','evening']},
            {id:'t28',time:'morning',emoji:'🌅',activity:'Waking up ⏰',answer:'morning',distractors:['afternoon','evening','night']},
            {id:'t29',time:'afternoon',emoji:'☀️',activity:'Playing outside 🛝',answer:'afternoon',distractors:['morning','evening','night']},
            {id:'t30',time:'evening',emoji:'🌆',activity:'Having dinner 🍽️',answer:'evening',distractors:['morning','afternoon','night']},
            {id:'t31',time:'night',emoji:'🌙',activity:'Brushing teeth 🪥',answer:'night',distractors:['morning','afternoon','evening']},
            {id:'t32',time:'morning',emoji:'🌅',activity:'Getting dressed 👕',answer:'morning',distractors:['afternoon','evening','night']},
            {id:'t33',time:'afternoon',emoji:'☀️',activity:'Having a snack 🍎',answer:'afternoon',distractors:['morning','evening','night']},
            {id:'t34',time:'evening',emoji:'🌆',activity:'Reading a book 📖',answer:'evening',distractors:['morning','afternoon','night']},
            {id:'t35',time:'night',emoji:'🌙',activity:'Saying goodnight 💤',answer:'night',distractors:['morning','afternoon','evening']},
            {id:'t36',time:'evening',emoji:'🌆',activity:'Watching TV 📺',answer:'evening',distractors:['morning','afternoon','night']},
        ],
    ];

    // ---------- Money (3 levels) ----------
    const MONEY_LEVELS = [
        [ // Level 1 — penny, nickel, dime
            {id:'mn1',coins:[{emoji:'🪙',label:'1¢',value:1}],total:1},
            {id:'mn2',coins:[{emoji:'🪙',label:'5¢',value:5}],total:5},
            {id:'mn3',coins:[{emoji:'🪙',label:'10¢',value:10}],total:10},
            {id:'mn4',coins:[{emoji:'🪙',label:'1¢'},{emoji:'🪙',label:'1¢'}],total:2},
            {id:'mn5',coins:[{emoji:'🪙',label:'1¢'},{emoji:'🪙',label:'1¢'},{emoji:'🪙',label:'1¢'}],total:3},
            {id:'mn6',coins:[{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'1¢'}],total:6},
            {id:'mn7',coins:[{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'1¢'}],total:11},
            {id:'mn8',coins:[{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'5¢'}],total:15},
            {id:'mn9',coins:[{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'}],total:10},
            {id:'mn10',coins:[{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'10¢'}],total:20},
        ],
        [ // Level 2 — quarter, half dollar
            {id:'mn11',coins:[{emoji:'🪙',label:'25¢',value:25}],total:25},
            {id:'mn12',coins:[{emoji:'🪙',label:'50¢',value:50}],total:50},
            {id:'mn13',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'10¢'}],total:35},
            {id:'mn14',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'25¢'}],total:50},
            {id:'mn15',coins:[{emoji:'🪙',label:'50¢'},{emoji:'🪙',label:'10¢'}],total:60},
            {id:'mn16',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'5¢'}],total:30},
            {id:'mn17',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'1¢'}],total:26},
            {id:'mn18',coins:[{emoji:'🪙',label:'50¢'},{emoji:'🪙',label:'25¢'}],total:75},
        ],
        [ // Level 3 — mixed combinations up to $1
            {id:'mn19',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'10¢'}],total:70},
            {id:'mn20',coins:[{emoji:'🪙',label:'50¢'},{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'5¢'}],total:100},
            {id:'mn21',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'25¢'}],total:100},
            {id:'mn22',coins:[{emoji:'🪙',label:'50¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'}],total:80},
            {id:'mn23',coins:[{emoji:'🪙',label:'50¢'},{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'25¢'}],total:100},
            {id:'mn24',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'}],total:60},
            {id:'mn25',coins:[{emoji:'🪙',label:'50¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'}],total:100},
            {id:'mn26',coins:[{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'25¢'},{emoji:'🪙',label:'10¢'},{emoji:'🪙',label:'5¢'},{emoji:'🪙',label:'5¢'}],total:70},
        ],
    ];

    // ---------- One More / One Less (3 levels) ----------
    const ONEMORELESS_LEVELS = [
        [ // Level 1 — numbers 1-10
            {id:'om1',number:5,mode:'more',answer:6},
            {id:'om2',number:3,mode:'less',answer:2},
            {id:'om3',number:8,mode:'more',answer:9},
            {id:'om4',number:7,mode:'less',answer:6},
            {id:'om5',number:1,mode:'more',answer:2},
            {id:'om6',number:10,mode:'less',answer:9},
            {id:'om7',number:4,mode:'more',answer:5},
            {id:'om8',number:9,mode:'more',answer:10},
            {id:'om9',number:6,mode:'less',answer:5},
            {id:'om10',number:2,mode:'more',answer:3},
        ],
        [ // Level 2 — numbers 11-20
            {id:'om11',number:12,mode:'more',answer:13},
            {id:'om12',number:15,mode:'less',answer:14},
            {id:'om13',number:18,mode:'more',answer:19},
            {id:'om14',number:20,mode:'less',answer:19},
            {id:'om15',number:11,mode:'more',answer:12},
            {id:'om16',number:16,mode:'less',answer:15},
            {id:'om17',number:14,mode:'more',answer:15},
            {id:'om18',number:19,mode:'less',answer:18},
            {id:'om19',number:13,mode:'more',answer:14},
            {id:'om20',number:17,mode:'less',answer:16},
        ],
        [ // Level 3 — numbers 21-50
            {id:'om21',number:25,mode:'more',answer:26},
            {id:'om22',number:30,mode:'less',answer:29},
            {id:'om23',number:42,mode:'more',answer:43},
            {id:'om24',number:50,mode:'less',answer:49},
            {id:'om25',number:21,mode:'more',answer:22},
            {id:'om26',number:35,mode:'less',answer:34},
            {id:'om27',number:40,mode:'more',answer:41},
            {id:'om28',number:48,mode:'less',answer:47},
            {id:'om29',number:28,mode:'more',answer:29},
            {id:'om30',number:33,mode:'less',answer:32},
        ],
    ];

    // ---------- Rhyming (3 levels) ----------
    const RHYMING_LEVELS = [
        [ // Level 1 — simple CVC words
            {id:'rh1',word:'cat',emoji:'🐱',correct:'hat',distractors:['dog','car','cup']},
            {id:'rh2',word:'dog',emoji:'🐶',correct:'log',distractors:['cat','dig','dot']},
            {id:'rh3',word:'bat',emoji:'🦇',correct:'mat',distractors:['big','bit','bed']},
            {id:'rh4',word:'sun',emoji:'☀️',correct:'fun',distractors:['sin','sum','son']},
            {id:'rh5',word:'pig',emoji:'🐷',correct:'wig',distractors:['big','peg','pin']},
            {id:'rh6',word:'hen',emoji:'🐔',correct:'pen',distractors:['hat','hug','hit']},
            {id:'rh7',word:'bed',emoji:'🛏️',correct:'red',distractors:['bad','bun','bid']},
            {id:'rh8',word:'cup',emoji:'☕',correct:'pup',distractors:['cap','cop','cut']},
            {id:'rh9',word:'fan',emoji:'🌀',correct:'ran',distractors:['fun','fin','fin']},
            {id:'rh10',word:'map',emoji:'🗺️',correct:'cap',distractors:['mop','mud','mix']},
        ],
        [ // Level 2 — word families (-ake, -ight, -ound)
            {id:'rh11',word:'cake',emoji:'🎂',correct:'lake',distractors:['cook','cave','come']},
            {id:'rh12',word:'snake',emoji:'🐍',correct:'lake',distractors:['snack','sneak','snore']},
            {id:'rh13',word:'light',emoji:'💡',correct:'night',distractors:['left','late','loud']},
            {id:'rh14',word:'right',emoji:'👉',correct:'sight',distractors:['write','root','rest']},
            {id:'rh15',word:'ound',emoji:'🔊',correct:'ground',distractors:['sound','wound','round']},
            {id:'rh16',word:'lake',emoji:'🏞️',correct:'bake',distractors:['lock','look','luck']},
            {id:'rh17',word:'kite',emoji:'🪁',correct:'bite',distractors:['knot','kept','kit']},
            {id:'rh18',word:'moon',emoji:'🌙',correct:'soon',distractors:['moan','map','man']},
            {id:'rh19',word:'rain',emoji:'🌧️',correct:'train',distractors:['run','ring','ram']},
            {id:'rh20',word:'stone',emoji:'🪨',correct:'bone',distractors:['stand','start','stay']},
        ],
        [ // Level 3 — harder rhymes
            {id:'rh21',word:'play',emoji:'🎮',correct:'day',distractors:['plow','plan','ply']},
            {id:'rh22',word:'ring',emoji:'💍',correct:'sing',distractors:['rang','rig','rim']},
            {id:'rh23',word:'grow',emoji:'🌱',correct:'slow',distractors:['grin','grid','grab']},
            {id:'rh24',word:'ship',emoji:'🚢',correct:'trip',distractors:['shop','shot','shut']},
            {id:'rh25',word:'fish',emoji:'🐟',correct:'dish',distractors:['fist','fit','fad']},
            {id:'rh26',word:'tree',emoji:'🌳',correct:'free',distractors:['true','try','tin']},
            {id:'rh27',word:'slide',emoji:'🛝',correct:'glide',distractors:['slid','slim','slap']},
            {id:'rh28',word:'wave',emoji:'🌊',correct:'cave',distractors:['wax','win','wig']},
            {id:'rh29',word:'star',emoji:'⭐',correct:'car',distractors:['start','store','stay']},
            {id:'rh30',word:'home',emoji:'🏠',correct:'dome',distractors:['hop','hit','him']},
        ],
    ];

    // ---------- Sight Words (5 levels) ----------
    const SIGHTWORDS_LEVELS = [
        [ // Level 1
            {id:'the',emoji:'📖'},{id:'a',emoji:'📝'},{id:'I',emoji:'🙋'},{id:'is',emoji:'✅'},{id:'it',emoji:'🔹'},
            {id:'see',emoji:'👀'},{id:'can',emoji:'🥫'},{id:'you',emoji:'👉'},
        ],
        [ // Level 2
            {id:'my',emoji:'🎒'},{id:'we',emoji:'👫'},{id:'he',emoji:'👦'},{id:'she',emoji:'👧'},{id:'do',emoji:'❓'},
            {id:'in',emoji:'📥'},{id:'up',emoji:'⬆️'},{id:'on',emoji:'🔛'},
        ],
        [ // Level 3
            {id:'go',emoji:'🏃'},{id:'no',emoji:'🚫'},{id:'so',emoji:'➡️'},{id:'to',emoji:'🎯'},{id:'me',emoji:'🙋‍♂️'},
            {id:'big',emoji:'🐘'},{id:'run',emoji:'🏃‍♂️'},{id:'play',emoji:'🎮'},
        ],
        [ // Level 4
            {id:'and',emoji:'➕'},{id:'or',emoji:'🔀'},{id:'but',emoji:'⚡'},{id:'if',emoji:'🤔'},{id:'at',emoji:'📍'},
            {id:'like',emoji:'👍'},{id:'help',emoji:'🤝'},{id:'look',emoji:'🔍'},
        ],
        [ // Level 5
            {id:'said',emoji:'💬'},{id:'was',emoji:'⏪'},{id:'have',emoji:'🤲'},{id:'been',emoji:'🕐'},{id:'come',emoji:'🚶'},
            {id:'good',emoji:'🌟'},{id:'make',emoji:'🛠️'},{id:'away',emoji:'🛫'},
        ],
    ];

    // ---------- Make 10 (3 levels) ----------
    const MAKE10_LEVELS = [
        [ // Level 1 — Make 5
            {id:'mk1',given:2,target:5,answer:3,options:[1,2,3,4]},
            {id:'mk2',given:1,target:5,answer:4,options:[2,3,4,5]},
            {id:'mk3',given:3,target:5,answer:2,options:[1,2,3,5]},
            {id:'mk4',given:4,target:5,answer:1,options:[0,1,2,3]},
            {id:'mk5',given:0,target:5,answer:5,options:[3,4,5,6]},
            {id:'mk6',given:5,target:5,answer:0,options:[0,1,2,3]},
        ],
        [ // Level 2 — Make 10
            {id:'mk7',given:3,target:10,answer:7,options:[5,6,7,8]},
            {id:'mk8',given:7,target:10,answer:3,options:[2,3,4,5]},
            {id:'mk9',given:2,target:10,answer:8,options:[6,7,8,9]},
            {id:'mk10',given:8,target:10,answer:2,options:[1,2,3,4]},
            {id:'mk11',given:5,target:10,answer:5,options:[3,4,5,6]},
            {id:'mk12',given:6,target:10,answer:4,options:[2,3,4,5]},
            {id:'mk13',given:4,target:10,answer:6,options:[4,5,6,7]},
            {id:'mk14',given:1,target:10,answer:9,options:[7,8,9,10]},
        ],
        [ // Level 3 — Make 20
            {id:'mk15',given:7,target:20,answer:13,options:[11,12,13,14]},
            {id:'mk16',given:12,target:20,answer:8,options:[6,7,8,9]},
            {id:'mk17',given:15,target:20,answer:5,options:[3,4,5,6]},
            {id:'mk18',given:3,target:20,answer:17,options:[15,16,17,18]},
            {id:'mk19',given:10,target:20,answer:10,options:[8,9,10,11]},
            {id:'mk20',given:14,target:20,answer:6,options:[4,5,6,7]},
        ],
    ];

    // ---------- Decompose Numbers (3 levels) ----------
    const DECOMPOSE_LEVELS = [
        [ // Level 1 — Decompose 1-5
            {id:'dc1',number:2,answer:[0,2],options:[[0,2],[1,1],[0,3],[1,3]]},
            {id:'dc2',number:3,answer:[1,2],options:[[1,2],[0,3],[2,2],[1,1]]},
            {id:'dc3',number:4,answer:[2,2],options:[[2,2],[1,3],[0,4],[3,1]]},
            {id:'dc4',number:5,answer:[2,3],options:[[2,3],[1,4],[0,5],[3,3]]},
            {id:'dc5',number:1,answer:[0,1],options:[[0,1],[1,0],[0,2],[2,0]]},
            {id:'dc16',number:3,answer:[0,3],options:[[0,3],[1,3],[2,2],[0,4]]},
            {id:'dc17',number:4,answer:[1,3],options:[[1,3],[0,3],[2,3],[1,4]]},
            {id:'dc18',number:5,answer:[1,4],options:[[1,4],[1,3],[2,4],[0,4]]},
        ],
        [ // Level 2 — Decompose 6-10
            {id:'dc6',number:6,answer:[3,3],options:[[3,3],[2,4],[1,5],[0,6]]},
            {id:'dc7',number:7,answer:[3,4],options:[[3,4],[2,5],[1,6],[4,4]]},
            {id:'dc8',number:8,answer:[4,4],options:[[4,4],[3,5],[2,6],[1,7]]},
            {id:'dc9',number:9,answer:[4,5],options:[[4,5],[3,6],[2,7],[5,5]]},
            {id:'dc10',number:10,answer:[5,5],options:[[5,5],[4,6],[3,7],[2,8]]},
            {id:'dc19',number:6,answer:[2,4],options:[[2,4],[2,3],[3,4],[1,4]]},
            {id:'dc20',number:8,answer:[3,5],options:[[3,5],[2,5],[4,5],[3,4]]},
            {id:'dc21',number:10,answer:[4,6],options:[[4,6],[3,6],[5,6],[4,5]]},
        ],
        [ // Level 3 — Multiple ways
            {id:'dc11',number:5,answer:[1,4],options:[[1,4],[2,3],[0,5],[3,3]]},
            {id:'dc12',number:7,answer:[2,5],options:[[2,5],[3,4],[1,6],[0,7]]},
            {id:'dc13',number:10,answer:[3,7],options:[[3,7],[4,6],[5,5],[2,8]]},
            {id:'dc14',number:8,answer:[1,7],options:[[1,7],[2,6],[3,5],[4,4]]},
            {id:'dc15',number:6,answer:[0,6],options:[[0,6],[1,5],[2,4],[3,3]]},
            {id:'dc22',number:4,answer:[0,4],options:[[0,4],[0,3],[1,4],[2,3]]},
            {id:'dc23',number:9,answer:[2,7],options:[[2,7],[1,7],[3,7],[2,6]]},
            {id:'dc24',number:10,answer:[2,8],options:[[2,8],[1,8],[3,8],[2,7]]},
        ],
    ];

    // ---------- Teen Numbers (3 levels) ----------
    const TEEN_NUMBERS_LEVELS = [
        [ // Level 1 — 11-13
            {id:'tn1',number:11,ten:10,ones:1,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩'},
            {id:'tn2',number:12,ten:10,ones:2,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩'},
            {id:'tn3',number:13,ten:10,ones:3,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩🟩'},
        ],
        [ // Level 2 — 14-16
            {id:'tn4',number:14,ten:10,ones:4,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩🟩🟩'},
            {id:'tn5',number:15,ten:10,ones:5,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩🟩🟩🟩'},
            {id:'tn6',number:16,ten:10,ones:6,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩🟩🟩🟩🟩'},
        ],
        [ // Level 3 — 17-19
            {id:'tn7',number:17,ten:10,ones:7,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩🟩🟩🟩🟩🟩'},
            {id:'tn8',number:18,ten:10,ones:8,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩🟩🟩🟩🟩🟩🟩'},
            {id:'tn9',number:19,ten:10,ones:9,emoji:'🟦🟦🟦🟦🟦🟦🟦🟦🟦🟦🟩🟩🟩🟩🟩🟩🟩🟩🟩'},
        ],
    ];

    // ---------- Sort & Classify (3 levels) ----------
    const SORT_CLASSIFY_LEVELS = [
        [ // Level 1 — Sort by color
            {id:'sc1',objects:[{emoji:'🍎',category:'red'},{emoji:'🔵',category:'blue'},{emoji:'🍀',category:'green'},{emoji:'🍅',category:'red'},{emoji:'🌎',category:'blue'}],question:'How many red ones?',answer:2,options:[1,2,3,4]},
            {id:'sc2',objects:[{emoji:'🍎',category:'red'},{emoji:'🔵',category:'blue'},{emoji:'🍀',category:'green'},{emoji:'💎',category:'blue'},{emoji:'🟢',category:'green'}],question:'How many blue ones?',answer:2,options:[1,2,3,4]},
            {id:'sc3',objects:[{emoji:'🍎',category:'red'},{emoji:'🟢',category:'green'},{emoji:'🍀',category:'green'},{emoji:'🍅',category:'red'},{emoji:'🟢',category:'green'}],question:'How many green ones?',answer:3,options:[2,3,4,5]},
        ],
        [ // Level 2 — Sort by shape
            {id:'sc4',objects:[{emoji:'⚽',category:'circle'},{emoji:'🟦',category:'square'},{emoji:'🔺',category:'triangle'},{emoji:'🏀',category:'circle'},{emoji:'🔺',category:'triangle'}],question:'How many circles?',answer:2,options:[1,2,3,4]},
            {id:'sc5',objects:[{emoji:'🟦',category:'square'},{emoji:'🔴',category:'circle'},{emoji:'🟦',category:'square'},{emoji:'🔺',category:'triangle'},{emoji:'🟦',category:'square'}],question:'How many squares?',answer:3,options:[2,3,4,5]},
            {id:'sc6',objects:[{emoji:'🔺',category:'triangle'},{emoji:'🟦',category:'square'},{emoji:'🔺',category:'triangle'},{emoji:'🔺',category:'triangle'},{emoji:'🔵',category:'circle'}],question:'How many triangles?',answer:3,options:[1,2,3,4]},
        ],
        [ // Level 3 — Sort by size
            {id:'sc7',objects:[{emoji:'🐘',category:'big'},{emoji:'🐜',category:'small'},{emoji:'🐘',category:'big'},{emoji:'🐁',category:'small'},{emoji:'🐘',category:'big'}],question:'How many big animals?',answer:3,options:[2,3,4,5]},
            {id:'sc8',objects:[{emoji:'🐜',category:'small'},{emoji:'🐋',category:'big'},{emoji:'🐜',category:'small'},{emoji:'🐁',category:'small'},{emoji:'🐋',category:'big'}],question:'How many small animals?',answer:3,options:[2,3,4,5]},
            {id:'sc9',objects:[{emoji:'🐦',category:'medium'},{emoji:'🐘',category:'big'},{emoji:'🐜',category:'small'},{emoji:'🐦',category:'medium'},{emoji:'🐘',category:'big'}],question:'How many medium animals?',answer:2,options:[1,2,3,4]},
        ],
    ];

    // ---------- 3D Shapes (3 levels) ----------
    const SHAPES3D_LEVELS = [
        [ // Level 1 — sphere, cube, cone
            {id:'s3d1',name:'Sphere',emoji:'🔵',realWorld:['ball','orange'],fact:'A sphere is round all over like a ball.'},
            {id:'s3d2',name:'Cube',emoji:'🧊',realWorld:['dice','ice cube'],fact:'A cube has 6 square faces.'},
            {id:'s3d3',name:'Cone',emoji:'🔺',realWorld:['ice cream cone','traffic cone'],fact:'A cone has a circle base and a point on top.'},
        ],
        [ // Level 2 — cylinder, pyramid, rectangular prism
            {id:'s3d4',name:'Cylinder',emoji:'🥫',realWorld:['can','tube'],fact:'A cylinder has 2 circle faces and one curved side.'},
            {id:'s3d5',name:'Pyramid',emoji:'🔷',realWorld:['pyramid','roof'],fact:'A pyramid has a flat base and triangles on each side.'},
            {id:'s3d6',name:'Rectangular Prism',emoji:'📦',realWorld:['box','book'],fact:'A rectangular prism has 6 rectangle faces.'},
        ],
        [ // Level 3 — mixed review
            {id:'s3d7',name:'Sphere',emoji:'⚽',realWorld:['soccer ball','globe'],fact:'A sphere is round like a ball.'},
            {id:'s3d8',name:'Cylinder',emoji:'🥤',realWorld:['cup','pipe'],fact:'A cylinder looks like a can.'},
            {id:'s3d9',name:'Cone',emoji:'🎪',realWorld:['party hat','funnel'],fact:'A cone is pointy on top.'},
            {id:'s3d10',name:'Cube',emoji:'🎲',realWorld:['block','box'],fact:'A cube has 6 equal faces.'},
            {id:'s3d11',name:'Pyramid',emoji:'🏛️',realWorld:['Egyptian pyramid','prism'],fact:'A pyramid has triangle sides.'},
            {id:'s3d12',name:'Rectangular Prism',emoji:'🧱',realWorld:['brick','shoebox'],fact:'A rectangular prism is like a box.'},
        ],
    ];

    // ---------- Print Concepts (2 levels) ----------
    const PRINT_CONCEPTS_LEVELS = [
        [ // Level 1 — Parts of a book
            {id:'pc1',scenario:'📖',question:'Where is the cover of the book?',answer:'Front',options:['Front','Back','Middle','Spine']},
            {id:'pc2',scenario:'📖',question:'Where do you find the title?',answer:'Front cover',options:['Front cover','Back cover','Last page','Middle page']},
            {id:'pc3',scenario:'📚',question:'What do you read first?',answer:'Front cover',options:['Front cover','Last page','Back cover','Middle']},
            {id:'pc4',scenario:'📖',question:'Where are the pages?',answer:'Inside',options:['Inside','Front cover','Back cover','Spine']},
            {id:'pc5',scenario:'✍️',question:'Who writes a book?',answer:'Author',options:['Author','Reader','Teacher','Student']},
            {id:'pc11',scenario:'🎨',question:'Who draws the pictures in a book?',answer:'Illustrator',options:['Illustrator','Author','Reader','Publisher']},
            {id:'pc12',scenario:'🏷️',question:'What tells you the name of a book?',answer:'Title',options:['Title','Page number','Cover','Spine']},
            {id:'pc13',scenario:'📚',question:'What holds the pages together?',answer:'Spine',options:['Spine','Front cover','Back cover','Bookmark']},
        ],
        [ // Level 2 — Reading direction
            {id:'pc6',scenario:'➡️',question:'Which way do you read words on a page?',answer:'Left to right',options:['Left to right','Right to left','Top to bottom','Bottom to top']},
            {id:'pc7',scenario:'⬇️',question:'Which way do you read lines on a page?',answer:'Top to bottom',options:['Top to bottom','Bottom to top','Left to right','Right to left']},
            {id:'pc8',scenario:'📖',question:'Which page comes first in a book?',answer:'Front',options:['Front','Back','Middle','It doesn\'t matter']},
            {id:'pc9',scenario:'➡️➡️',question:'After the first page, where do you go?',answer:'Next page',options:['Next page','Previous page','Last page','Back cover']},
            {id:'pc10',scenario:'📖✅',question:'When you finish a book, what comes last?',answer:'Back cover',options:['Back cover','Front cover','First page','Title page']},
            {id:'pc14',scenario:'␣',question:'What goes between words when you write?',answer:'Space',options:['Space','Period','Comma','Letter']},
            {id:'pc15',scenario:'🔤',question:'What letter starts a sentence?',answer:'Capital letter',options:['Capital letter','Lowercase letter','Number','Symbol']},
            {id:'pc16',scenario:'❓',question:'What mark ends an asking sentence?',answer:'Question mark',options:['Question mark','Period','Comma','Space']},
        ],
    ];

    // ---------- Beginning/Ending Sounds (3 levels) ----------
    const BEGIN_END_SOUNDS_LEVELS = [
        [ // Level 1 — Beginning sounds
            {id:'bes1',word:'Cat',emoji:'🐱',position:'beginning',answer:'c',options:['c','b','d','t']},
            {id:'bes2',word:'Dog',emoji:'🐶',position:'beginning',answer:'d',options:['d','b','g','t']},
            {id:'bes3',word:'Ball',emoji:'⚽',position:'beginning',answer:'b',options:['b','d','a','l']},
            {id:'bes4',word:'Fish',emoji:'🐟',position:'beginning',answer:'f',options:['f','s','p','h']},
            {id:'bes5',word:'Sun',emoji:'☀️',position:'beginning',answer:'s',options:['s','h','b','m']},
            {id:'bes6',word:'Tree',emoji:'🌳',position:'beginning',answer:'t',options:['t','r','l','e']},
        ],
        [ // Level 2 — Ending sounds
            {id:'bes7',word:'Cat',emoji:'🐱',position:'ending',answer:'t',options:['t','c','a','s']},
            {id:'bes8',word:'Dog',emoji:'🐶',position:'ending',answer:'g',options:['g','d','o','s']},
            {id:'bes9',word:'Fish',emoji:'🐟',position:'ending',answer:'sh',options:['sh','s','h','f']},
            {id:'bes10',word:'Bus',emoji:'🚌',position:'ending',answer:'s',options:['s','b','u','z']},
            {id:'bes11',word:'Hand',emoji:'✋',position:'ending',answer:'d',options:['d','h','n','t']},
            {id:'bes12',word:'Bike',emoji:'🚲',position:'ending',answer:'k',options:['k','b','i','e']},
        ],
        [ // Level 3 — Mixed review
            {id:'bes13',word:'Map',emoji:'🗺️',position:'beginning',answer:'m',options:['m','p','a','d']},
            {id:'bes14',word:'Ten',emoji:'🔟',position:'ending',answer:'n',options:['n','t','e','s']},
            {id:'bes15',word:'Lion',emoji:'🦁',position:'beginning',answer:'l',options:['l','i','o','n']},
            {id:'bes16',word:'Jump',emoji:'🦘',position:'ending',answer:'p',options:['p','j','u','m']},
            {id:'bes17',word:'Cup',emoji:'☕',position:'beginning',answer:'c',options:['c','u','p','k']},
            {id:'bes18',word:'Bed',emoji:'🛏️',position:'ending',answer:'d',options:['d','b','e','t']},
        ],
    ];

    // ---------- Complete Sentences (3 levels) ----------
    const SENTENCES_LEVELS = [
        [ // Level 1 — Capital letter at start
            {id:'sn1',broken:'the cat is big',correct:'The cat is big.',options:['The cat is big.','the cat is big.','The cat is big','the cat is big']},
            {id:'sn2',broken:'i like apples',correct:'I like apples.',options:['I like apples.','i like apples.','I like apples','i like apples']},
            {id:'sn3',broken:'the dog runs fast',correct:'The dog runs fast.',options:['The dog runs fast.','the dog runs fast.','The dog runs fast','the dog runs fast']},
            {id:'sn4',broken:'we play outside',correct:'We play outside.',options:['We play outside.','we play outside.','We play outside','we play outside']},
            {id:'sn5',broken:'she is happy',correct:'She is happy.',options:['She is happy.','she is happy.','She is happy','she is happy']},
            {id:'sn16',broken:'i see the cat',correct:'I see the cat.',options:['I see the cat.','i see the cat.','I see the cat','i see the cat']},
            {id:'sn17',broken:'the dog is big',correct:'The dog is big.',options:['The dog is big.','the dog is big.','The dog is big','the dog is big']},
            {id:'sn18',broken:'we can jump',correct:'We can jump.',options:['We can jump.','we can jump.','We can jump','we can jump']},
        ],
        [ // Level 2 — Period at end
            {id:'sn6',broken:'the dog runs.',correct:'The dog runs.',options:['The dog runs.','the dog runs.','The dog runs','the dog runs']},
            {id:'sn7',broken:'i am tall.',correct:'I am tall.',options:['I am tall.','i am tall.','I am tall','i am tall']},
            {id:'sn8',broken:'we sing a song.',correct:'We sing a song.',options:['We sing a song.','we sing a song.','We sing a song','we sing a song']},
            {id:'sn9',broken:'they jump high.',correct:'They jump high.',options:['They jump high.','they jump high.','They jump high','they jump high']},
            {id:'sn10',broken:'he reads a book.',correct:'He reads a book.',options:['He reads a book.','he reads a book.','He reads a book','he reads a book']},
            {id:'sn19',broken:'the bus is big.',correct:'The bus is big.',options:['The bus is big.','the bus is big.','The bus is big','the bus is big']},
            {id:'sn20',broken:'my mom smiles.',correct:'My mom smiles.',options:['My mom smiles.','my mom smiles.','My mom smiles','my mom smiles']},
            {id:'sn21',broken:'they swim fast.',correct:'They swim fast.',options:['They swim fast.','they swim fast.','They swim fast','they swim fast']},
        ],
        [ // Level 3 — Both capital + period
            {id:'sn11',broken:'the bird sings',correct:'The bird sings.',options:['The bird sings.','the bird sings.','The bird sings','the bird sings']},
            {id:'sn12',broken:'i go to school',correct:'I go to school.',options:['I go to school.','i go to school.','I go to school','i go to school']},
            {id:'sn13',broken:'we eat lunch',correct:'We eat lunch.',options:['We eat lunch.','we eat lunch.','We eat lunch','we eat lunch']},
            {id:'sn14',broken:'the sun is bright',correct:'The sun is bright.',options:['The sun is bright.','the sun is bright.','The sun is bright','the sun is bright']},
            {id:'sn15',broken:'she walks to school',correct:'She walks to school.',options:['She walks to school.','she walks to school.','She walks to school','she walks to school']},
            {id:'sn22',broken:'birds fly in the sky',correct:'Birds fly in the sky.',options:['Birds fly in the sky.','birds fly in the sky.','Birds fly in the sky','birds fly in the sky']},
            {id:'sn23',broken:'the flowers are pretty',correct:'The flowers are pretty.',options:['The flowers are pretty.','the flowers are pretty.','The flowers are pretty','the flowers are pretty']},
            {id:'sn24',broken:'we read books together',correct:'We read books together.',options:['We read books together.','we read books together.','We read books together','we read books together']},
        ],
    ];

    // ---------- Prepositions (3 levels) ----------
    const PREPOSITIONS_LEVELS = [
        [ // Level 1 — in, on, under
            {id:'pr1',scene:'🐱⬇️📦',answer:'under',options:['in','on','under','next to']},
            {id:'pr2',scene:'🐱⬆️📦',answer:'on',options:['in','on','under','behind']},
            {id:'pr3',scene:'🐱📦',answer:'in',options:['in','on','under','between']},
            {id:'pr4',scene:'🐱📦',answer:'on',options:['in','on','under','next to']},
            {id:'pr5',scene:'📦⬇️🐱',answer:'under',options:['in','on','under','in front of']},
            {id:'pr6',scene:'📦🐱',answer:'in',options:['in','on','under','behind']},
        ],
        [ // Level 2 — behind, in front of, between
            {id:'pr7',scene:'🪑🐱📦',answer:'between',options:['behind','in front of','between','next to']},
            {id:'pr8',scene:'📦🐱',answer:'behind',options:['behind','in front of','between','under']},
            {id:'pr9',scene:'🐱📦',answer:'in front of',options:['behind','in front of','between','under']},
            {id:'pr10',scene:'📦🐱📦',answer:'between',options:['behind','in front of','between','on']},
            {id:'pr11',scene:'📦🐱',answer:'behind',options:['behind','in front of','on','under']},
            {id:'pr12',scene:'🐱📦',answer:'in front of',options:['behind','in front of','on','under']},
        ],
        [ // Level 3 — above, below, next to
            {id:'pr13',scene:'🐱⬆️📦',answer:'above',options:['above','below','next to','in']},
            {id:'pr14',scene:'🐱⬇️📦',answer:'below',options:['above','below','next to','on']},
            {id:'pr15',scene:'🐱📦',answer:'next to',options:['above','below','next to','in']},
            {id:'pr16',scene:'📦⬆️🐱',answer:'above',options:['above','below','next to','under']},
            {id:'pr17',scene:'📦⬇️🐱',answer:'below',options:['above','below','next to','over']},
            {id:'pr18',scene:'📦🐱',answer:'next to',options:['above','below','next to','behind']},
        ],
    ];

    // ---------- Sort by Category (3 levels) ----------
    const SORT_CATEGORY_LEVELS = [
        [ // Level 1 — Foods vs Animals vs Clothes
            {id:'stc1',item:{emoji:'🍎',name:'apple'},correctCategory:'Food',categories:['Food','Animal','Clothing','Color']},
            {id:'stc2',item:{emoji:'🐱',name:'cat'},correctCategory:'Animal',categories:['Food','Animal','Clothing','Color']},
            {id:'stc3',item:{emoji:'👕',name:'shirt'},correctCategory:'Clothing',categories:['Food','Animal','Clothing','Color']},
            {id:'stc4',item:{emoji:'🍌',name:'banana'},correctCategory:'Food',categories:['Food','Animal','Clothing','Color']},
            {id:'stc5',item:{emoji:'🐶',name:'dog'},correctCategory:'Animal',categories:['Food','Animal','Clothing','Color']},
            {id:'stc6',item:{emoji:'🧣',name:'scarf'},correctCategory:'Clothing',categories:['Food','Animal','Clothing','Color']},
        ],
        [ // Level 2 — Furniture vs Vehicles vs Tools
            {id:'stc7',item:{emoji:'🪑',name:'chair'},correctCategory:'Furniture',categories:['Furniture','Vehicle','Tool','Food']},
            {id:'stc8',item:{emoji:'🚗',name:'car'},correctCategory:'Vehicle',categories:['Furniture','Vehicle','Tool','Food']},
            {id:'stc9',item:{emoji:'🔨',name:'hammer'},correctCategory:'Tool',categories:['Furniture','Vehicle','Tool','Food']},
            {id:'stc10',item:{emoji:'🛏️',name:'bed'},correctCategory:'Furniture',categories:['Furniture','Vehicle','Tool','Food']},
            {id:'stc11',item:{emoji:'🚌',name:'bus'},correctCategory:'Vehicle',categories:['Furniture','Vehicle','Tool','Food']},
            {id:'stc12',item:{emoji:'🪛',name:'screwdriver'},correctCategory:'Tool',categories:['Furniture','Vehicle','Tool','Food']},
        ],
        [ // Level 3 — Mixed categories
            {id:'stc13',item:{emoji:'📚',name:'book'},correctCategory:'School',categories:['Food','Animal','School','Nature']},
            {id:'stc14',item:{emoji:'🌳',name:'tree'},correctCategory:'Nature',categories:['Food','Animal','School','Nature']},
            {id:'stc15',item:{emoji:'🐸',name:'frog'},correctCategory:'Animal',categories:['Food','Animal','School','Nature']},
            {id:'stc16',item:{emoji:'🥕',name:'carrot'},correctCategory:'Food',categories:['Food','Animal','School','Nature']},
            {id:'stc17',item:{emoji:'✏️',name:'pencil'},correctCategory:'School',categories:['Food','Animal','School','Nature']},
            {id:'stc18',item:{emoji:'🌊',name:'water'},correctCategory:'Nature',categories:['Food','Animal','School','Nature']},
        ],
    ];

    // ---------- Mapped arrays for new categories ----------
    const PATTERNS_MAPPED = PATTERNS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const COMPARING_MAPPED = COMPARING_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const POSITIONS_MAPPED = POSITIONS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const MEASUREMENT_MAPPED = MEASUREMENT_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const TIME_MAPPED = TIME_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const MONEY_MAPPED = MONEY_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const ONEMORELESS_MAPPED = ONEMORELESS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const RHYMING_MAPPED = RHYMING_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const SIGHTWORDS_MAPPED = SIGHTWORDS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const MAKE10_MAPPED = MAKE10_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const DECOMPOSE_MAPPED = DECOMPOSE_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const TEEN_NUMBERS_MAPPED = TEEN_NUMBERS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const SORT_CLASSIFY_MAPPED = SORT_CLASSIFY_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const SHAPES3D_MAPPED = SHAPES3D_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const PRINT_CONCEPTS_MAPPED = PRINT_CONCEPTS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const BEGIN_END_SOUNDS_MAPPED = BEGIN_END_SOUNDS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const SENTENCES_MAPPED = SENTENCES_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const PREPOSITIONS_MAPPED = PREPOSITIONS_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));
    const SORT_CATEGORY_MAPPED = SORT_CATEGORY_LEVELS.map((entries, i) => ({
        id: 'L' + (i+1), label: 'Level ' + (i+1), icon: LEVEL_ICONS[i], items: entries
    }));


    // ---------- Category registry ----------
    const CATEGORIES = [
        {key:'letters', name:'Letters', icon:'🔤', leveled:false, levels:[{id:'L1', label:'Level 1', icon:LEVEL_ICONS[0], items:LETTERS}]},
        {key:'numbers', name:'Numbers', icon:'🔢', leveled:false, levels:[{id:'L1', label:'Level 1', icon:LEVEL_ICONS[0], items:NUMBERS}]},
        {key:'words', name:'English', icon:'📖', leveled:true, levels:WORDS_LEVELS},
        {key:'chinese', name:'Chinese', icon:'🇨🇳', leveled:true, levels:CHINESE_LEVELS},
        {key:'spanish', name:'Spanish', icon:'🇪🇸', leveled:true, levels:SPANISH_LEVELS},
        {key:'math', name:'Math', icon:'➕', leveled:true, levels:MATH_LEVELS},
        {key:'science', name:'Science', icon:'🔬', leveled:true, levels:SCIENCE_LEVELS_MAPPED},
        {key:'patterns', name:'Patterns', icon:'🔁', leveled:true, levels:PATTERNS_MAPPED},
        {key:'comparing', name:'Comparing', icon:'⚖️', leveled:true, levels:COMPARING_MAPPED},
        {key:'positions', name:'Positions', icon:'📍', leveled:true, levels:POSITIONS_MAPPED},
        {key:'measurement', name:'Measuring', icon:'📏', leveled:true, levels:MEASUREMENT_MAPPED},
        {key:'time', name:'Time', icon:'⏰', leveled:true, levels:TIME_MAPPED},
        {key:'money', name:'Money', icon:'🪙', leveled:true, levels:MONEY_MAPPED},
        {key:'onemoreless', name:'More or Less', icon:'➕➖', leveled:true, levels:ONEMORELESS_MAPPED},
        {key:'rhyming', name:'Rhyming', icon:'🎵', leveled:true, levels:RHYMING_MAPPED},
        {key:'sightwords', name:'Sight Words', icon:'👁️', leveled:true, levels:SIGHTWORDS_MAPPED},
        {key:'make10', name:'Make 10', icon:'🔟', leveled:true, levels:MAKE10_MAPPED},
        {key:'decompose', name:'Decompose', icon:'🔢', leveled:true, levels:DECOMPOSE_MAPPED},
        {key:'teennumbers', name:'Teen Numbers', icon:'🟦', leveled:true, levels:TEEN_NUMBERS_MAPPED},
        {key:'sortclassify', name:'Sort & Classify', icon:'🎨', leveled:true, levels:SORT_CLASSIFY_MAPPED},
        {key:'shapes3d', name:'3D Shapes', icon:'🧊', leveled:true, levels:SHAPES3D_MAPPED},
        {key:'printconcepts', name:'Print Concepts', icon:'📖', leveled:true, levels:PRINT_CONCEPTS_MAPPED},
        {key:'begendsounds', name:'Sounds', icon:'🔤', leveled:true, levels:BEGIN_END_SOUNDS_MAPPED},
        {key:'sentences', name:'Sentences', icon:'✏️', leveled:true, levels:SENTENCES_MAPPED},
        {key:'prepositions', name:'Prepositions', icon:'📍', leveled:true, levels:PREPOSITIONS_MAPPED},
        {key:'sortcategory', name:'Categories', icon:'🏷️', leveled:true, levels:SORT_CATEGORY_MAPPED}
    ];

    // ---------- Trace categories ----------
    const TRACE_CATEGORIES = ['letters', 'numbers', 'words', 'chinese', 'spanish'];
