
-- Distance function --
delimiter $$
drop function if exists getdistance$$
create function getdistance 
  (deg_lat1 float, deg_lng1 float, deg_lat2 float, deg_lng2 float) 
  returns float 
  deterministic 
begin 
  declare distance float;
  declare delta_lat float; 
  declare delta_lng float; 
  declare lat1 float; 
  declare lat2 float;
  declare a float;

  set distance = 0;

  /*convert degrees to radians and get the variables i need.*/
  set delta_lat = radians(deg_lat2 - deg_lat1); 
  set delta_lng = radians(deg_lng2 - deg_lng1); 
  set lat1 = radians(deg_lat1); 
  set lat2 = radians(deg_lat2); 

  /*formula found here: http://www.movable-type.co.uk/scripts/latlong.html*/
  set a = sin(delta_lat/2.0) * sin(delta_lat/2.0) + sin(delta_lng/2.0) * sin(delta_lng/2.0) * cos(lat1) * cos(lat2); 
  set distance = 3956.6 * 2 * atan2(sqrt(a),  sqrt(1-a)); 

  return distance;
end$$
delimiter ;
