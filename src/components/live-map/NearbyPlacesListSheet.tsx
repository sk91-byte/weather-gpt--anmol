import React from 'react';
import { NearbySafePlace } from '../../types';
import { X, MapPin, Navigation, Clock } from '../Icons';

interface NearbyPlacesListSheetProps {
  category: string | null;
  places: NearbySafePlace[];
  selectedPlaceId?: string;
  onSelectPlace: (place: NearbySafePlace) => void;
  onClose: () => void;
  onNavigateToPlace: (place: NearbySafePlace) => void;
}

export const NearbyPlacesListSheet: React.FC<NearbyPlacesListSheetProps> = ({
  category,
  places,
  selectedPlaceId,
  onSelectPlace,
  onClose,
  onNavigateToPlace
}) => {
  const categoryLabels: Record<string, { title: string; icon: string }> = {
    restaurant: { title: 'Nearby Restaurants', icon: '🍽️' },
    cafe: { title: 'Nearby Cafes', icon: '☕' },
    petrol: { title: 'Nearby Petrol Pumps', icon: '⛽' },
    hospital: { title: 'Nearby Hospitals & Clinics', icon: '🏥' },
    hotel: { title: 'Nearby Hotels & Lounges', icon: '🏨' },
    convenience: { title: 'Nearby Stores', icon: '🏪' }
  };

  const currentCat = category ? categoryLabels[category] || { title: 'Nearby Places', icon: '📍' } : { title: 'Nearby Places', icon: '📍' };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto p-3 flex justify-center animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 max-h-[50vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentCat.icon}</span>
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {currentCat.title} ({places.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Verified dry shelters & waiting spots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Places List (Horizontal or Scrollable vertical cards) */}
        <div className="overflow-y-auto space-y-2.5 pr-1">
          {places.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              No verified places found in this immediate radius.
            </div>
          ) : (
            places.map((place) => {
              const isSelected = place.id === selectedPlaceId;
              return (
                <div
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 shadow-sm'
                      : 'bg-slate-50/90 hover:bg-white border-slate-200/80'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {place.name}
                      </h4>
                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md shrink-0">
                        ⭐ {place.rating}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2 truncate">
                      <span>{place.distanceMeters} m away</span>
                      <span>•</span>
                      <span>{place.walkingMinutes} min walk</span>
                      <span>•</span>
                      <span className="truncate">{place.openStatus}</span>
                    </div>

                    <p className="text-[10px] font-semibold text-emerald-700 mt-1 truncate">
                      🛡️ {place.shelterFeature}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlace(place);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 shadow-xs cursor-pointer"
                    >
                      VIEW ON MAP
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToPlace(place);
                      }}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      title="Route here"
                    >
                      <Navigation className="w-3.5 h-3.5 fill-white stroke-none" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
