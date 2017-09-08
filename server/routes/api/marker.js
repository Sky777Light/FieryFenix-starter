const router = require("express").Router();
const async = require("async");

const Marker = require("../../models/marker");

//create markers
router.post("/save", (req, res) => {
    let savedMarkers = [];

    async.each( req.body, (marker, callback) => {

        let newMarker = new Marker({
            owner: marker.owner || '',
            lat: marker.lat || 0,
            lng: marker.lng || 0,
            label: marker.label,
            draggable: marker.draggable,
            visible: marker.visible
        });

        newMarker.save( (err, marker) => {
            if (err) return err;

            savedMarkers.push(marker);
            callback();
        });

    }, (err) => {

        if(err){
            return res.json({
                status: true,
                res: savedMarkers,
                message: `${req.body.length > 1 ? "Marker" : "Some markers"}  isn't correct.`
            });
        }
        return res.json({
            status: true,
            res: savedMarkers,
            message: `${savedMarkers.length > 1 ? "Marker" : "Markers"} successfully was added.`
        });
    });

});


module.exports = router;
