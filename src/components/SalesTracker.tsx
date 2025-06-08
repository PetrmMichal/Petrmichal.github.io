
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Download, Moon, Sun, Calendar, TrendingUp, Users, Target, Edit2, User, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Consultant {
  id: string;
  name: string;
  dailyTarget: number;
  currentAmount: number;
  segments: Record<string, number>;
  avatar?: string;
}

interface SegmentData {
  name: string;
  color: string;
  emoji: string;
  excludeFromTotal?: boolean;
}

const segments: SegmentData[] = [
  { name: 'Air Bank', color: 'bg-green-500', emoji: '🏛️' },
  { name: 'Postpaid', color: 'bg-blue-500', emoji: '📞' },
  { name: 'IND', color: 'bg-purple-500', emoji: '🌐' },
  { name: 'TV', color: 'bg-orange-500', emoji: '📺' },
  { name: 'Campra', color: 'bg-yellow-500', emoji: '📈' },
  { name: 'HW', color: 'bg-gray-500', emoji: '📱' },
  { name: 'ICO', color: 'bg-red-500', emoji: '💼', excludeFromTotal: true },
  { name: 'Zbytek', color: 'bg-black', emoji: '🗑️' }
];

const defaultTeam = [
  'Petr Michal', 'Aleš Mörtl', 'Daniel Rusín', 'Michael Arnošt Beneš',
  'Jakub Škarda', 'Terezie Beránková', 'Vítek Hakr', 'Josef Studený',
  'Barbora Grillová', 'Eliška Hanáková', 'No Name', 'No Name'
];

const SalesTracker = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [showCongratulations, setShowCongratulations] = useState<string>('');
  const [storeTarget, setStoreTarget] = useState(5000);
  const [editingStoreTarget, setEditingStoreTarget] = useState(false);
  const [editingConsultantTarget, setEditingConsultantTarget] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<string>('');

  // Initialize consultants
  useEffect(() => {
    const initialConsultants: Consultant[] = defaultTeam.map((name, index) => ({
      id: `consultant-${index}`,
      name,
      dailyTarget: 1000,
      currentAmount: 0,
      segments: segments.reduce((acc, segment) => ({ ...acc, [segment.name]: 0 }), {}),
      avatar: undefined
    }));
    setConsultants(initialConsultants);
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load dark mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setIsDarkMode(JSON.parse(savedMode));
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const formatTime = (date: Date) => {
    return date.toLocaleString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getTotalAmount = (consultant: Consultant) => {
    return Object.entries(consultant.segments)
      .filter(([segmentName]) => !segments.find(s => s.name === segmentName)?.excludeFromTotal)
      .reduce((sum, [, amount]) => sum + amount, 0);
  };

  const handleConsultantSelect = (consultantId: string) => {
    setSelectedConsultant(consultantId);
    // Move selected consultant to top
    setConsultants(prev => {
      const selected = prev.find(c => c.id === consultantId);
      const others = prev.filter(c => c.id !== consultantId);
      return selected ? [selected, ...others] : prev;
    });
  };

  const handleChangeUser = () => {
    setSelectedConsultant('');
  };

  const updateSegmentAmount = (consultantId: string, segmentName: string, amount: number) => {
    setConsultants(prev => prev.map(consultant => {
      if (consultant.id === consultantId) {
        const updatedConsultant = {
          ...consultant,
          segments: { ...consultant.segments, [segmentName]: amount }
        };
        
        const totalAmount = getTotalAmount(updatedConsultant);
        
        // Check if goal is exceeded
        if (totalAmount >= consultant.dailyTarget && getTotalAmount(consultant) < consultant.dailyTarget) {
          setShowCongratulations(consultantId);
          setTimeout(() => setShowCongratulations(''), 5000);
        }
        
        return updatedConsultant;
      }
      return consultant;
    }));
  };

  const updateConsultantTarget = (consultantId: string, newTarget: number) => {
    setConsultants(prev => prev.map(consultant => 
      consultant.id === consultantId 
        ? { ...consultant, dailyTarget: newTarget }
        : consultant
    ));
  };

  const handleImageUpload = (consultantId: string, file: File) => {
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setConsultants(prev => prev.map(consultant => 
          consultant.id === consultantId 
            ? { ...consultant, avatar: base64String }
            : consultant
        ));
        setUploadingAvatar('');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = (consultantId: string) => {
    setUploadingAvatar(consultantId);
    fileInputRef.current?.click();
  };

  const getStoreTotal = () => {
    return consultants.reduce((sum, consultant) => sum + getTotalAmount(consultant), 0);
  };

  const storeProgress = calculateProgress(getStoreTotal(), storeTarget);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingAvatar) {
            handleImageUpload(uploadingAvatar, file);
          }
        }}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Tracker</h1>
              {selectedConsultant && (
                <Button variant="outline" size="sm" onClick={handleChangeUser}>
                  <User className="w-4 h-4 mr-2" />
                  Change User
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-lg font-mono bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-white">{formatTime(currentTime)}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Store Progress */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-6 h-6" />
                <span>Store Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                {editingStoreTarget ? (
                  <Input
                    type="number"
                    value={storeTarget}
                    onChange={(e) => setStoreTarget(Number(e.target.value) || 0)}
                    onBlur={() => setEditingStoreTarget(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingStoreTarget(false)}
                    className="w-24 h-8 text-black"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="cursor-pointer flex items-center space-x-1"
                    onClick={() => setEditingStoreTarget(true)}
                  >
                    <span>{storeTarget.toLocaleString()} Kč target</span>
                    <Edit2 className="w-4 h-4" />
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getStoreTotal().toLocaleString()} Kč</span>
                <span>{storeProgress.toFixed(1)}%</span>
              </div>
              <Progress value={storeProgress} className="h-3 bg-white/20" />
            </div>
          </CardContent>
        </Card>

        {/* Team Selection */}
        {!selectedConsultant && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span>Select Your Name</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {consultants.map((consultant) => (
                  <Button
                    key={consultant.id}
                    variant="outline"
                    className="p-4 h-auto text-left hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => handleConsultantSelect(consultant.id)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar className="w-10 h-10">
                        {consultant.avatar ? (
                          <AvatarImage src={consultant.avatar} alt={consultant.name} />
                        ) : (
                          <AvatarFallback>
                            {consultant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-semibold">{consultant.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getTotalAmount(consultant).toLocaleString()} Kč
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Consultants Table */}
        {selectedConsultant && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sales Performance Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Consultant</th>
                      {segments.map((segment) => (
                        <th key={segment.name} className="text-center p-4 font-semibold min-w-[120px]">
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-2xl">{segment.emoji}</span>
                            <span className="text-sm">{segment.name}</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-4 font-semibold">Total</th>
                      <th className="text-center p-4 font-semibold">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultants.map((consultant, index) => {
                      const totalAmount = getTotalAmount(consultant);
                      const progress = calculateProgress(totalAmount, consultant.dailyTarget);
                      const isGoalExceeded = progress >= 100;
                      const showAnimation = showCongratulations === consultant.id;

                      return (
                        <tr 
                          key={consultant.id} 
                          className={`border-b relative ${
                            isGoalExceeded 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                              : ''
                          } ${
                            selectedConsultant === consultant.id && index === 0
                              ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                              : ''
                          }`}
                        >
                          {showAnimation && (
                            <td colSpan={segments.length + 3} className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 z-10 animate-pulse">
                              <div className="text-center">
                                <div className="text-4xl mb-2">🎉✨🌟</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  Congratulations!!
                                </div>
                                <div className="text-lg text-gray-600 dark:text-gray-300">
                                  Goal achieved!
                                </div>
                              </div>
                            </td>
                          )}
                          
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <Avatar className="w-12 h-12">
                                  {consultant.avatar ? (
                                    <AvatarImage src={consultant.avatar} alt={consultant.name} />
                                  ) : (
                                    <AvatarFallback>
                                      {consultant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="absolute -top-1 -right-1 w-6 h-6 p-0 rounded-full"
                                  onClick={() => triggerImageUpload(consultant.id)}
                                >
                                  <Upload className="w-3 h-3" />
                                </Button>
                              </div>
                              <div>
                                <div className="font-semibold">{consultant.name}</div>
                                {index === 0 && selectedConsultant === consultant.id && (
                                  <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          {segments.map((segment) => (
                            <td key={segment.name} className="p-4 text-center">
                              <Input
                                type="number"
                                min="0"
                                value={consultant.segments[segment.name] || 0}
                                onChange={(e) => updateSegmentAmount(
                                  consultant.id, 
                                  segment.name, 
                                  Number(e.target.value) || 0
                                )}
                                className="w-full text-center"
                                placeholder="0"
                              />
                            </td>
                          ))}
                          
                          <td className="p-4 text-center font-bold text-lg">
                            {totalAmount.toLocaleString()} Kč
                          </td>
                          
                          <td className="p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span>{progress.toFixed(1)}%</span>
                                {editingConsultantTarget === consultant.id ? (
                                  <Input
                                    type="number"
                                    value={consultant.dailyTarget}
                                    onChange={(e) => updateConsultantTarget(consultant.id, Number(e.target.value) || 0)}
                                    onBlur={() => setEditingConsultantTarget('')}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingConsultantTarget('')}
                                    className="w-20 h-6 text-xs"
                                    autoFocus
                                  />
                                ) : (
                                  <span 
                                    className="cursor-pointer flex items-center space-x-1"
                                    onClick={() => setEditingConsultantTarget(consultant.id)}
                                  >
                                    <span>{consultant.dailyTarget.toLocaleString()}</span>
                                    <Edit2 className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <Progress 
                                value={progress} 
                                className={`h-2 ${isGoalExceeded ? 'bg-green-100 dark:bg-green-900' : ''}`}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Consultant Cards (for mobile/smaller screens) */}
        {!selectedConsultant && (
          <div className="space-y-4 md:hidden">
            {consultants.map((consultant, index) => {
              const totalAmount = getTotalAmount(consultant);
              const progress = calculateProgress(totalAmount, consultant.dailyTarget);
              const isGoalExceeded = progress >= 100;

              return (
                <Card key={consultant.id} className={`${isGoalExceeded ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          {consultant.avatar ? (
                            <AvatarImage src={consultant.avatar} alt={consultant.name} />
                          ) : (
                            <AvatarFallback>
                              {consultant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{consultant.name}</span>
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {totalAmount.toLocaleString()} Kč
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {progress.toFixed(1)}% of {consultant.dailyTarget.toLocaleString()} Kč
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Progress value={progress} className={`mb-4 h-3 ${isGoalExceeded ? 'bg-green-100 dark:bg-green-900' : ''}`} />
                    <div className="grid grid-cols-2 gap-3">
                      {segments.map((segment) => (
                        <div key={segment.name} className="space-y-2">
                          <label className="flex items-center space-x-2 text-sm font-medium">
                            <span>{segment.emoji}</span>
                            <span>{segment.name}</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={consultant.segments[segment.name] || 0}
                            onChange={(e) => updateSegmentAmount(
                              consultant.id, 
                              segment.name, 
                              Number(e.target.value) || 0
                            )}
                            className="w-full"
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesTracker;
