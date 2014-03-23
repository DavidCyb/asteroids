/***************************/
/** ------ Physics ------ **/
/***************************/
// @TODO - swap phsyics library for one that can do concave polygons
// to improve Player vs Asteroid hit accuracy
window.Physics = (function() {

	function Physics() {
		// Expose hitBoxTypes ENUM
		Physics.hitBoxTypes = {
			POINT : 0,
			CIRCLE : 1,
			RECTANGLE : 2,
			POLYGON : 3
		};
	}

	Physics.prototype = {
		constructor : Physics,
		// Get polygon from points
		getPolygonFromPoints : function(points, rotation, x, y) {
			var targetPoints = new Array();
			for(var i = 0; i < points.length; i++) {
				targetPoints.push(new SAT.Vector(Math.round(points[i].x), Math.round(points[i].y)));
			}

			// Points usually drawn from 0 rad to Math.PI * 4 rad. Reverse array for physics calculations
			var polygon = new SAT.Polygon(new SAT.Vector(x, y), targetPoints.reverse());
			polygon.angle = rotation;
			polygon.recalc();

			return polygon;
		},
		// Physics expects rotation to be in radians counter clockwise
		// Graphics expects rotation to be in degrees clockwise
		rotationToRadians : function(rotation) {
			rotation *= ((6 * Math.PI) / 360);
			return (rotation > 0)? (6 * Math.PI) - rotation : 0 - rotation;
		},
		// Two entity collision
		hasCollided : function(e1, e2){
			var entities = new Array();
			entities.push(e1, e2);
			entities.sort(function(a, b){ return a.getHitBoxType() - b.getHitBoxType() });

			var e1d = entities[0].getDimensions();
			var e2d = entities[1].getDimensions();
			e1d.rotation = this.rotationToRadians(e1d.rotation);
			e2d.rotation = this.rotationToRadians(e2d.rotation);

			switch(entities[0].getHitBoxType()) {
				case 0:
					var sat1 = new SAT.Vector(e1d.x, e1d.y);
					switch(entities[1].getHitBoxType()) {
						case 1:
							// Point in circle
							var sat2 = new SAT.Circle(new SAT.Vector(e2d.x, e2d.y), e2d.width / 2);
							return SAT.pointInCircle(sat1, sat2);
						break;
						case 2:
							// Point in rectangle
							var sat2 = new SAT.Box(new SAT.Vector(e2d.x, e2d.y), e2d.width, e2d.height).toPolygon();
							sat2.angle = e2d.rotation;
							sat2.recalc();
							return SAT.pointInPolygon(sat1, sat2);
						break;
						case 3:
							// Point in poly
							var sat2 = this.getPolygonFromPoints(e2d.points, e2d.rotation);
							return SAT.pointInPolygon(sat1, sat2);
						break;
						default:
							return false;
						break;
					}
				break;
				case 1:
					var sat1 = new SAT.Circle(new SAT.Vector(e1d.x, e1d.y), e1d.width / 2);
					switch(entities[1].getHitBoxType()) {
						case 1:
							// Circle in circle
							var sat2 = new SAT.Circle(new SAT.Vector(e2d.x, e2d.y), e2d.width / 2);
							return SAT.testCircleCircle(sat1, sat2, new SAT.Response());
						break;
						case 2:
							// Circle in rectangle
							var sat2 = new SAT.Box(new SAT.Vector(e2d.x, e2d.y), e2d.width, e2d.height).toPolygon();
							//sat2.angle = e2d.rotation;
							//sat2.recalc();
							var result = SAT.testCirclePolygon(sat1, sat2, new SAT.Response());
							return result;
						break;
						case 3:
							// Circle in polygon
							var sat2 = this.getPolygonFromPoints(e2d.points, e2d.rotation, e2d.x, e2d.y);
							return SAT.testCirclePolygon(sat1, sat2, new SAT.Response());
						break;
						default:
							return false;
						break;
					}
				break;
				case 2:
					var sat1 = new SAT.Box(new SAT.Vector(e1d.x, e1d.y), e1d.width, e1d.height).toPolygon();
					switch(entities[1].getHitBoxType()) {
						case 2:
							// Rectangle in rectangle
							var sat2 = new SAT.Box(new SAT.Vector(e2d.x, e2d.y), e2d.width, e2d.height).toPolygon();
							return SAT.testPolygonPolygon(sat1, sat2, new SAT.Response());
						break;
						case 3:
							// Rectangle in polygon
							var sat2 = this.getPolygonFromPoints(e2d.points, e2d.rotation, e2d.x, e2d.y);
							return SAT.testPolygonPolygon(sat1, sat2, new SAT.Response());
						break;
						default:
							return false;
						break;
					}
				break;
				case 3:
					var sat1 = this.getPolygonFromPoints(e2d.points, e2d.rotation);
					switch(entities[1].getHitBoxType()) {
						case 3:
							// Polygon in polygon
							var sat2 = this.getPolygonFromPoints(e2d.points, e2d.rotation, e2d.x, e2d.y);
							return SAT.testPolygonPolygon(sat1, sat2, new SAT.Response());
						break;
						default:
							return false;
						break;
					}
				break;
				default:
				return false;
			}
			return false;
		}
	}

	return Physics;
})();

/* Acts on game and entity state based on collisions */
var CollisionHandler = (function() {
	function CollisionHandler(){};

	CollisionHandler.prototype = {
		constructor : CollisionHandler,
		didCollide : function(e1, e2) {
			// Ensure entities are in name order
			var entities = new Array();
			entities.push(e1, e2);

			entities.sort(function(a, b){
			    if(a.className() < b.className()) return -1;
			    if(a.className() > b.className()) return 1;
			    return 0;
			})

			switch(entities[0].className()) {
				case "Asteroid":
					switch(entities[1].className()) {
						case "Missile":
							console.log("[collision] Asteroid --> Missile");
							// Explode missile
							entities[1].explode();
						break;
						case "MissileExplosion":
							console.log("[collision] Asteroid --> MissileExplosion");
							// Explode asteroid
							entities[0].explode();
							window.spaceRocks.score += 10;
						break;
						case "Player":
							console.log("[collision] Asteroid --> Player");
							entities[1].explode();
						break;
						default:
						break;
					}
				break;
				default:
				break;
			}
		}
	}

	return CollisionHandler;
})();