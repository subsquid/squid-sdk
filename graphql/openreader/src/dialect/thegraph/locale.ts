import {inflections, pluralize} from 'inflected'

const THEGRAPH_LOCALE = 'thegraph'

// ref https://github.com/whatisinternet/Inflector/blob/master/src/string/pluralize/mod.rs
inflections(THEGRAPH_LOCALE, (inflector) => {
    inflector.plural(/(\w*)$/, '$1s')
    inflector.plural(/(\w*)s$/, '$1s')
    inflector.plural(/(\w*([^aeiou]ese))$/, '$1')
    inflector.plural(/(\w*(ax|test))is$/, '$1es')
    inflector.plural(/(\w*(alias|[^aou]us|tlas|gas|ris))$/, '$1es')
    inflector.plural(/(\w*(e[mn]u))s?$/, '$1s')
    inflector.plural(/(\w*([^l]ias|[aeiou]las|[emjzr]as|[iu]am))$/, '$1')
    inflector.plural(
        /(\w*(alumn|syllab|octop|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat))(?:us|i)$/,
        '$1i'
    )
    inflector.plural(/(\w*(alumn|alg|vertebr))(?:a|ae)$/, '$1ae')
    inflector.plural(/(\w*(seraph|cherub))(?:im)?$/, '$1im')
    inflector.plural(/(\w*(her|at|gr))o$/, '$1oes')
    inflector.plural(
        /(\w*(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor))(?:a|um)$/,
        '$1a'
    )
    inflector.plural(
        /(\w*(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat))(?:a|on)$/,
        '$1a'
    )
    inflector.plural(/(\w*)sis$/, '$1ses')
    inflector.plural(/(\w*(kni|wi|li))fe$/, '$1ves')
    inflector.plural(/(\w*(ar|l|ea|eo|oa|hoo))f$/, '$1ves')
    inflector.plural(/(\w*([^aeiouy]|qu))y$/, '$1ies')
    inflector.plural(/(\w*([^ch][ieo][ln]))ey$/, '$1ies')
    inflector.plural(/(\w*(x|ch|ss|sh|zz)es)$/, '$1')
    inflector.plural(/(\w*(x|ch|ss|sh|zz))$/, '$1es')
    inflector.plural(/(\w*(matr|cod|mur|sil|vert|ind|append))(?:ix|ex)$/, '$1ices')
    inflector.plural(/(\w*(m|l)(?:ice|ouse))$/, '$1ice')
    inflector.plural(/(\w*(pe)(?:rson|ople))$/, '$1ople')
    inflector.plural(/(\w*(child))(?:ren)?$/, '$1ren')
    inflector.plural(/(\w*eaux)$/, '$1')

    inflector.irregular('ox', 'oxes')
    inflector.irregular('man', 'men')
    inflector.irregular('woman', 'women')
    inflector.irregular('die', 'dice')
    inflector.irregular('yes', 'yeses')
    inflector.irregular('foot', 'feet')
    inflector.irregular('eave', 'eaves')
    inflector.irregular('goose', 'geese')
    inflector.irregular('tooth', 'teeth')
    inflector.irregular('quiz', 'quizzes')

    inflector.uncountable(
        'accommodation',
        'adulthood',
        'advertising',
        'advice',
        'aggression',
        'aid',
        'air',
        'aircraft',
        'alcohol',
        'anger',
        'applause',
        'arithmetic',
        'assistance',
        'athletics',

        'bacon',
        'baggage',
        'beef',
        'biology',
        'blood',
        'botany',
        'bread',
        'butter',

        'carbon',
        'cardboard',
        'cash',
        'chalk',
        'chaos',
        'chess',
        'crossroads',
        'countryside',

        'dancing',
        'deer',
        'dignity',
        'dirt',
        'dust',

        'economics',
        'education',
        'electricity',
        'engineering',
        'enjoyment',
        'envy',
        'equipment',
        'ethics',
        'evidence',
        'evolution',

        'fame',
        'fiction',
        'flour',
        'flu',
        'food',
        'fuel',
        'fun',
        'furniture',

        'gallows',
        'garbage',
        'garlic',
        'genetics',
        'gold',
        'golf',
        'gossip',
        'grammar',
        'gratitude',
        'grief',
        'guilt',
        'gymnastics',

        'happiness',
        'hardware',
        'harm',
        'hate',
        'hatred',
        'health',
        'heat',
        'help',
        'homework',
        'honesty',
        'honey',
        'hospitality',
        'housework',
        'humour',
        'hunger',
        'hydrogen',

        'ice',
        'importance',
        'inflation',
        'information',
        'innocence',
        'iron',
        'irony',

        'jam',
        'jewelry',
        'judo',

        'karate',
        'knowledge',

        'lack',
        'laughter',
        'lava',
        'leather',
        'leisure',
        'lightning',
        'linguine',
        'linguini',
        'linguistics',
        'literature',
        'litter',
        'livestock',
        'logic',
        'loneliness',
        'luck',
        'luggage',

        'macaroni',
        'machinery',
        'magic',
        'management',
        'mankind',
        'marble',
        'mathematics',
        'mayonnaise',
        'measles',
        'methane',
        'milk',
        'money',
        'mud',
        'music',
        'mumps',

        'nature',
        'news',
        'nitrogen',
        'nonsense',
        'nurture',
        'nutrition',

        'obedience',
        'obesity',
        'oxygen',

        'pasta',
        'patience',
        'physics',
        'poetry',
        'pollution',
        'poverty',
        'pride',
        'psychology',
        'publicity',
        'punctuation',

        'quartz',

        'racism',
        'relaxation',
        'reliability',
        'research',
        'respect',
        'revenge',
        'rice',
        'rubbish',
        'rum',

        'safety',
        'scenery',
        'seafood',
        'seaside',
        'series',
        'shame',
        'sheep',
        'shopping',
        'sleep',
        'smoke',
        'smoking',
        'snow',
        'soap',
        'software',
        'soil',
        'spaghetti',
        'species',
        'steam',
        'stuff',
        'stupidity',
        'sunshine',
        'symmetry',

        'tennis',
        'thirst',
        'thunder',
        'timber',
        'traffic',
        'transportation',
        'trust',

        'underwear',
        'unemployment',
        'unity',

        'validity',
        'veal',
        'vegetation',
        'vegetarianism',
        'vengeance',
        'violence',
        'vitality',

        'warmth',
        'wealth',
        'weather',
        'welfare',
        'wheat',
        'wildlife',
        'wisdom',
        'yoga',

        'zinc',
        'zoology'
    )
})

export function toPlural(value: string) {
    return pluralize(value, THEGRAPH_LOCALE)
}