#ifndef _ECHO_
#define _ECHO_

#include <nan.h>
#include <mecab.h>

class Tagger : public Nan::ObjectWrap { 
  public:
    static NAN_METHOD(New);
    static NAN_METHOD(Parse);
    Tagger(const char *command);
    ~Tagger();
  private:
    MeCab::Tagger *tagger;
};

#endif
