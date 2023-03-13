class Weathercode {
    constructor(weathercode, description) {
        this.weathercode = weathercode;
        this.description = description;
    }
};

const weathercodes = [
    new Weathercode(0, "Sunny"),
    new Weathercode(1, "Mostly sunny"),
    new Weathercode(2, "Mostly cloudy"),
    new Weathercode(3, "Cloudy"),
    new Weathercode(45, "Fog"),
    new Weathercode(48, "Fog"),
    new Weathercode(51, "Drizzle"),
    new Weathercode(53, "Drizzle"),
    new Weathercode(55, "Light rain"),
    new Weathercode(56, "Freezing rain"),
    new Weathercode(57, "Freezing rain"),
    new Weathercode(61, "Light rain"),
    new Weathercode(63, "Rain"),
    new Weathercode(65, "Heavy rain"),
    new Weathercode(66, "Freezing rain"),
    new Weathercode(67, "Freezing rain"),
    new Weathercode(71, "Light snow"),
    new Weathercode(73, "Snow"),
    new Weathercode(75, "Heavy snow"),
    new Weathercode(77, "Snow grains"),
    new Weathercode(80, "Light showers"),
    new Weathercode(81, "Showers"),
    new Weathercode(82, "Heavy showers"),
    new Weathercode(85, "Snow showers"),
    new Weathercode(86, "Snow showers"),
    new Weathercode(95, "Thunderstorm"),
    new Weathercode(96, "Thunderstorm"),
    new Weathercode(99, "Thunderstorm"),
];
