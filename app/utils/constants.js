function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

// Define Constants
define("USERTYPE_DEVELOPER", "DEVELOPER");
define("USERTYPE_PROJECT_MANAGER", "PROJECT_MANAGER");