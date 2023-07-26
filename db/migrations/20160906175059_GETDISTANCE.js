exports.up = function(knex, Promise) {
    return knex.schema.raw(
        // "-- Distance function -- " +
        // "delimiter $$ " + "\n" +
        "create function GETDISTANCE  " + "\n" +
        "  (deg_lat1 float, deg_lng1 float, deg_lat2 float, deg_lng2 float)  " + "\n" +
        "  returns float  " + "\n" +
        "  deterministic  " + "\n" +
        "begin  " + "\n" +
        "  declare distance float; " + "\n" +
        "  declare delta_lat float;  " + "\n" +
        "  declare delta_lng float;  " + "\n" +
        "  declare lat1 float;  " + "\n" +
        "  declare lat2 float; " + "\n" +
        "  declare a float; " + "\n" +
        " " + "\n" +
        "  set distance = 0; " + "\n" +
        " " + "\n" +
        //"  /*convert degrees to radians and get the variables i need.*/ " + "\n" +
        "  set delta_lat = radians(deg_lat2 - deg_lat1);  " + "\n" +
        "  set delta_lng = radians(deg_lng2 - deg_lng1);  " + "\n" +
        "  set lat1 = radians(deg_lat1);  " + "\n" +
        "  set lat2 = radians(deg_lat2);  " + "\n" +
        " " + "\n" +
        //"  /*formula found here: http://www.movable-type.co.uk/scripts/latlong.html*/ " +
        "  set a = sin(delta_lat/2.0) * sin(delta_lat/2.0) + " + "\n" +
        "                    sin(delta_lng/2.0) * sin(delta_lng/2.0) * " + "\n" +
        "                    cos(lat1) * cos(lat2);  " + "\n" +
        "  set distance = 3956.6 * 2 * atan2(sqrt(a),  sqrt(1-a));  " + "\n" +
        " " + "\n" +
        "  return distance; " + "\n" +
        "end;" + "\n"
        // "delimiter ; "
    );

};

exports.down = function(knex, Promise) {
    return knex.raw("DROP FUNCTION IF EXISTS GETDISTANCE");
};